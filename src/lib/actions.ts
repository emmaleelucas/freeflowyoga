"use server";

import { createClient } from "@/lib/supabase/server";
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
      rooms (
        room_name,
        buildings (
          building_name,
          building_address
        )
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

  // Transform the data to match OldYogaClass type
  return data.map((classData: any) => ({
    id: classData.id,
    className: classData.class_name,
    startTime: new Date(classData.start_time),
    endTime: new Date(classData.end_time),
    instructorName: classData.instructor_name,
    classDescription: classData.class_description,
    matsProvided: classData.mats_provided,
    roomName: classData.rooms?.room_name || 'TBA',
    buildingName: classData.rooms?.buildings?.building_name || 'TBA',
    buildingAddress: classData.rooms?.buildings?.building_address || 'TBA'
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
      rooms (
        room_name,
        buildings (
          building_name,
          building_address
        )
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

  // Transform the data to match OldYogaClass type
  return data.map((classData: any) => ({
    id: classData.id,
    className: classData.class_name,
    startTime: new Date(classData.start_time),
    endTime: new Date(classData.end_time),
    instructorName: classData.instructor_name,
    classDescription: classData.class_description,
    matsProvided: classData.mats_provided,
    roomName: classData.rooms?.room_name || 'TBA',
    buildingName: classData.rooms?.buildings?.building_name || 'TBA',
    buildingAddress: classData.rooms?.buildings?.building_address || 'TBA'
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
        rooms (
          room_name,
          buildings (
            building_name,
            building_address
          )
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
        rooms (
          room_name,
          buildings (
            building_name,
            building_address
          )
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
