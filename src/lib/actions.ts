"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type OldYogaClass = {
  id: number;
  className: string;
  startTime: Date;
  endTime: Date;
  instructorName: string;
  matsProvided: boolean;
  classDescription: string;
  roomName: string;
  buildingName: string;
  buildingAddress: string;
};

// Fetch all upcoming yoga classes
export async function getAllYogaClasses(): Promise<OldYogaClass[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('yoga_classes')
    .select(`
      id,
      class_name,
      start_time,
      end_time,
      instructor_name,
      class_description,
      mats_provided,
      room_number,
      buildings (
        building_name,
        building_address
      )
    `)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching yoga classes:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Normalize date format to proper ISO format for consistent parsing
  const normalizeDate = (dateValue: any) => {
    if (!dateValue) return new Date();

    // If already a Date object, return it
    if (dateValue instanceof Date) return dateValue;

    // Convert to string and normalize format
    const dateStr = String(dateValue);
    const normalized = dateStr.replace(' ', 'T').replace(/\+00$/, 'Z').replace(/\+00:00$/, 'Z');
    return new Date(normalized);
  };

  // Transform the data to match OldYogaClass type
  return data.map((classData: any) => ({
    id: classData.id,
    className: classData.class_name,
    startTime: normalizeDate(classData.start_time),
    endTime: normalizeDate(classData.end_time),
    instructorName: classData.instructor_name,
    classDescription: classData.class_description,
    matsProvided: classData.mats_provided,
    roomName: classData.room_number || 'TBA',
    buildingName: classData.buildings?.building_name || 'TBA',
    buildingAddress: classData.buildings?.building_address || 'TBA'
  }));
}

// Fetch all yoga classes including past ones
export async function getAllYogaClassesIncludingPast(): Promise<OldYogaClass[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('yoga_classes')
    .select(`
      id,
      class_name,
      start_time,
      end_time,
      instructor_name,
      class_description,
      mats_provided,
      room_number,
      buildings (
        building_name,
        building_address
      )
    `)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching yoga classes:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Normalize date format to proper ISO format for consistent parsing
  const normalizeDate = (dateValue: any) => {
    if (!dateValue) return new Date();

    // If already a Date object, return it
    if (dateValue instanceof Date) return dateValue;

    // Convert to string and normalize format
    const dateStr = String(dateValue);
    const normalized = dateStr.replace(' ', 'T').replace(/\+00$/, 'Z').replace(/\+00:00$/, 'Z');
    return new Date(normalized);
  };

  // Transform the data to match OldYogaClass type
  return data.map((classData: any) => ({
    id: classData.id,
    className: classData.class_name,
    startTime: normalizeDate(classData.start_time),
    endTime: normalizeDate(classData.end_time),
    instructorName: classData.instructor_name,
    classDescription: classData.class_description,
    matsProvided: classData.mats_provided,
    roomName: classData.room_number || 'TBA',
    buildingName: classData.buildings?.building_name || 'TBA',
    buildingAddress: classData.buildings?.building_address || 'TBA'
  }));
}

// Register user for a yoga class
export async function registerForClass(classId: number) {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to register for a class' };
  }

  // Check if user is already registered
  const { data: existing } = await supabase
    .from('class_attendance')
    .select('id')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single();

  if (existing) {
    return { error: 'You are already registered for this class' };
  }

  // Register user for the class
  const { error: insertError } = await supabase
    .from('class_attendance')
    .insert({
      user_id: user.id,
      class_id: classId,
    });

  if (insertError) {
    console.error('Error registering for class:', insertError);
    return { error: 'Failed to register for class' };
  }

  // Increment enrollment count
  const { data: classData } = await supabase
    .from('yoga_classes')
    .select('current_enrollment')
    .eq('id', classId)
    .single();

  if (classData) {
    await supabase
      .from('yoga_classes')
      .update({ current_enrollment: classData.current_enrollment + 1 })
      .eq('id', classId);
  }

  revalidatePath('/schedule');
  revalidatePath('/protected/profile');

  return { success: true };
}

// Check if user is registered for a class
export async function checkUserRegistration(classId: number) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isRegistered: false, isAuthenticated: false };
  }

  const { data } = await supabase
    .from('class_attendance')
    .select('id')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single();

  return { isRegistered: !!data, isAuthenticated: true };
}

// Unregister user from a yoga class
export async function unregisterFromClass(classId: number) {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to unregister from a class' };
  }

  // Delete the registration
  const { error: deleteError } = await supabase
    .from('class_attendance')
    .delete()
    .eq('user_id', user.id)
    .eq('class_id', classId);

  if (deleteError) {
    console.error('Error unregistering from class:', deleteError);
    return { error: 'Failed to unregister from class' };
  }

  // Decrement enrollment count
  const { data: classData } = await supabase
    .from('yoga_classes')
    .select('current_enrollment')
    .eq('id', classId)
    .single();

  if (classData && classData.current_enrollment > 0) {
    await supabase
      .from('yoga_classes')
      .update({ current_enrollment: classData.current_enrollment - 1 })
      .eq('id', classId);
  }

  revalidatePath('/schedule');
  revalidatePath('/protected/profile');

  return { success: true };
}

// Get user's upcoming registered classes
export async function getUserUpcomingClasses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('class_attendance')
    .select(`
      id,
      registered_at,
      attended,
      yoga_classes!inner (
        id,
        class_name,
        start_time,
        end_time,
        instructor_name,
        class_description,
        mats_provided,
        is_cancelled,
        room_number,
        buildings (
          building_name,
          building_address
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('yoga_classes.start_time', new Date().toISOString());

  if (error) {
    console.error('Error fetching user classes:', error);
    return [];
  }

  // Sort by start time on the client side
  const sorted = (data || []).sort((a: any, b: any) => {
    const timeA = new Date(a.yoga_classes.start_time).getTime();
    const timeB = new Date(b.yoga_classes.start_time).getTime();
    return timeA - timeB;
  });

  return sorted;
}

// Get user's past registered classes
export async function getUserPastClasses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('class_attendance')
    .select(`
      id,
      registered_at,
      attended,
      yoga_classes!inner (
        id,
        class_name,
        start_time,
        end_time,
        instructor_name,
        class_description,
        mats_provided,
        is_cancelled,
        room_number,
        buildings (
          building_name,
          building_address
        )
      )
    `)
    .eq('user_id', user.id)
    .lt('yoga_classes.start_time', new Date().toISOString());

  if (error) {
    console.error('Error fetching user past classes:', error);
    return [];
  }

  // Sort by start time on the client side (most recent first)
  const sorted = (data || []).sort((a: any, b: any) => {
    const timeA = new Date(a.yoga_classes.start_time).getTime();
    const timeB = new Date(b.yoga_classes.start_time).getTime();
    return timeB - timeA;
  });

  return sorted;
}

// Type for series with aggregated data
export type SeriesWithDetails = {
  id: number;
  seriesName: string;
  seriesDescription: string;
  recurrencePattern: string;
  recurrenceDays: number[];
  startTime: string;
  endTime: string;
  matsProvided: boolean;
  instructorName: string | null; // Single instructor or null if multiple
  hasMultipleInstructors: boolean;
  location: {
    room: string;
    building: string;
    address: string;
  } | null; // Single location or null if multiple
  hasMultipleLocations: boolean;
  instanceCount: number;
  nextClassDate: Date | null;
};

// Fetch all active series with aggregated data
export async function getAllSeries(): Promise<SeriesWithDetails[]> {
  const supabase = await createClient();

  // Fetch all active series
  const { data: seriesData, error: seriesError } = await supabase
    .from('class_series')
    .select('*')
    .eq('is_active', true);

  if (seriesError) {
    console.error('Error fetching series:', seriesError);
    return [];
  }

  if (!seriesData || seriesData.length === 0) {
    return [];
  }

  // For each series, fetch instances and aggregate data
  const seriesWithDetails: SeriesWithDetails[] = [];

  for (const series of seriesData) {
    // Fetch all upcoming instances for this series
    const { data: instances, error: instancesError } = await supabase
      .from('yoga_classes')
      .select(`
        id,
        instructor_name,
        start_time,
        mats_provided,
        room_number,
        buildings (
          building_name,
          building_address
        )
      `)
      .eq('series_id', series.id)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (instancesError) {
      console.error('Error fetching instances:', instancesError);
      continue;
    }

    if (!instances || instances.length === 0) {
      continue; // Skip series with no upcoming instances
    }

    // Aggregate instructor data
    const instructors = new Set(instances.map((i: any) => i.instructor_name));
    const hasMultipleInstructors = instructors.size > 1;
    const instructorName = hasMultipleInstructors ? null : Array.from(instructors)[0];

    // Aggregate location data
    const locationStrings = instances.map((i: any) =>
      `${i.buildings?.building_name}|${i.room_number}`
    );
    const uniqueLocations = new Set(locationStrings);
    const hasMultipleLocations = uniqueLocations.size > 1;

    const firstInstance = instances[0] as any;
    const location = hasMultipleLocations ? null : {
      room: firstInstance.room_number || 'TBA',
      building: firstInstance.buildings?.building_name || 'TBA',
      address: firstInstance.buildings?.building_address || 'TBA'
    };

    // Get next class date
    const nextClassDate = new Date(firstInstance.start_time);

    // Get mats provided (use most common value or default)
    const matsProvidedCounts = instances.reduce((acc: any, i: any) => {
      acc[i.mats_provided ? 'true' : 'false'] = (acc[i.mats_provided ? 'true' : 'false'] || 0) + 1;
      return acc;
    }, {});
    const matsProvided = (matsProvidedCounts.true || 0) >= (matsProvidedCounts.false || 0);

    seriesWithDetails.push({
      id: series.id,
      seriesName: series.series_name,
      seriesDescription: series.series_description,
      recurrencePattern: series.recurrence_pattern,
      recurrenceDays: series.recurrence_days as number[],
      startTime: series.start_time,
      endTime: series.end_time,
      matsProvided,
      instructorName,
      hasMultipleInstructors,
      location,
      hasMultipleLocations,
      instanceCount: instances.length,
      nextClassDate
    });
  }

  // Sort by next class date
  seriesWithDetails.sort((a, b) => {
    if (!a.nextClassDate) return 1;
    if (!b.nextClassDate) return -1;
    return a.nextClassDate.getTime() - b.nextClassDate.getTime();
  });

  return seriesWithDetails;
}

// Get all unique class locations for the map
export async function getAllClassLocations() {
  const supabase = await createClient();

  // Fetch all upcoming class instances with their locations
  const { data, error } = await supabase
    .from('yoga_classes')
    .select(`
      series_id,
      room_number,
      buildings (
        building_name,
        building_address
      )
    `)
    .gte('start_time', new Date().toISOString());

  if (error) {
    console.error('Error fetching class locations:', error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Group by address and track which series use each location
  const locationMap = new Map<string, {
    building: string;
    address: string;
    seriesIds: Set<number>
  }>();

  data.forEach((classInstance: any) => {
    const address = classInstance.buildings?.building_address;
    const building = classInstance.buildings?.building_name;
    const seriesId = classInstance.series_id;

    if (address && address !== 'TBA' && building) {
      if (!locationMap.has(address)) {
        locationMap.set(address, {
          building,
          address,
          seriesIds: new Set()
        });
      }
      if (seriesId) {
        locationMap.get(address)!.seriesIds.add(seriesId);
      }
    }
  });

  // Convert to array format
  return Array.from(locationMap.values()).map(loc => ({
    building: loc.building,
    address: loc.address,
    seriesIds: Array.from(loc.seriesIds)
  }));
}

// Delete user account and all associated data
export async function deleteAccount() {
  const supabase = await createClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'You must be logged in to delete your account' };
  }

  // Delete all class attendance records for this user
  const { error: attendanceError } = await supabase
    .from('class_attendance')
    .delete()
    .eq('user_id', user.id);

  if (attendanceError) {
    console.error('Error deleting attendance records:', attendanceError);
    return { error: 'Failed to delete attendance records' };
  }

  // Delete user from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id);

  if (userError) {
    console.error('Error deleting user:', userError);
    return { error: 'Failed to delete user profile' };
  }

  // Sign out the user
  await supabase.auth.signOut();

  // Delete the auth user using admin client
  const adminClient = createAdminClient();
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteAuthError) {
    console.error('Error deleting auth user:', deleteAuthError);
    // Don't return error here - user data is already deleted and they're signed out
  }

  return { success: true };
}
