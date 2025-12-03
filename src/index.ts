import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { buildingsTable, roomsTable, yogaClassesTable } from './db/schema';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Helper function to generate classes from 1 month ago to 4 months ahead
function generateClassDates(dayOfWeek: number, startTime: string, endTime: string) {
  const classes = [];
  
  // Start date: 1 month ago
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  startDate.setHours(0, 0, 0, 0);
  
  // End date: 4 months from now
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 4);
  endDate.setHours(23, 59, 59, 999);
  
  // Find first occurrence of the day on or after start date
  const current = new Date(startDate);
  while (current.getDay() !== dayOfWeek) {
    current.setDate(current.getDate() + 1);
  }
  
  // Generate classes until we pass the end date
  while (current <= endDate) {
    const classDate = new Date(current);
    
    // Parse time and create start datetime
    const [startHour, startMinute] = parseTime(startTime);
    const startDateTime = new Date(classDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    // Parse time and create end datetime
    const [endHour, endMinute] = parseTime(endTime);
    const endDateTime = new Date(classDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);
    
    classes.push({
      startTime: startDateTime,
      endTime: endDateTime
    });
    
    // Move to next week
    current.setDate(current.getDate() + 7);
  }
  
  return classes;
}

// Helper to parse time strings like "6:15 AM"
function parseTime(timeStr: string): [number, number] {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return [hours, minutes];
}

async function seed() {
  try {
    console.log('Starting seed...');
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4);
    console.log(`Generating classes from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    // First, create buildings
    const buildings = await db.insert(buildingsTable).values([
      {
        buildingName: 'Chester E Peters Recreation Complex',
        buildingAddress: '1800 College Ave, Manhattan, KS 66502'
      },
      {
        buildingName: 'Multicultural Student Center',
        buildingAddress: 'K-State Student Union, Manhattan, KS 66506'
      },
      {
        buildingName: 'Regnier Hall',
        buildingAddress: '2323 N Manhattan Ave, Manhattan, KS 66502'
      }
    ]).returning();

    console.log(`Inserted ${buildings.length} buildings`);

    // Create rooms for each building
    const rooms = await db.insert(roomsTable).values([
      {
        roomName: 'Yoga Studio',
        buildingId: buildings[0].id // Chester E Peters
      },
      {
        roomName: 'Multipurpose Room',
        buildingId: buildings[1].id // Multicultural Student Center
      },
      {
        roomName: 'Community Room',
        buildingId: buildings[2].id // Regnier Hall
      }
    ]).returning();

    console.log(`Inserted ${rooms.length} rooms`);

    // Create a mapping for location names to room IDs
    const locationToRoomId: { [key: string]: number } = {
      'Chester E Peters Rec': rooms[0].id,
      'Multicultural Student Center': rooms[1].id,
      'Regnier Hall': rooms[2].id
    };

    // Generate all yoga classes
    const classTemplates = [
      {
        className: 'Yogalates',
        instructor: 'Rylee',
        day: 1, // Monday
        startTime: '6:15 AM',
        endTime: '7:00 AM',
        matsProvided: true,
        description: 'COMBINATION OF YOGA AND PILATES FOR THE ULTIMATE WORKOUT! (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Lift & Flow',
        instructor: 'Bella',
        day: 1, // Monday
        startTime: '6:15 PM',
        endTime: '7:15 PM',
        matsProvided: true,
        description: 'THIS CLASS COMBINES TRADITIONAL YOGA POSES WITH STRENGTH TRAINING USING LIGHT WEIGHTS. DESIGNED TO BUILD MUSCLE, IMPROVE BALANCE, AND INCREASE ENDURANCE, EACH SESSION BLENDS MINDFUL MOVEMENT WITH RESISTANCE BASED EXERCISES FOR A FULL-BODY WORKOUT. (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Intermediate Yoga',
        instructor: 'Julia',
        day: 1, // Monday
        startTime: '7:30 PM',
        endTime: '8:30 PM',
        matsProvided: true,
        description: 'UTILIZING POSES TO HELP WITH STRENGTH AND FLEXIBILITY, THIS CLASS IS DESIGNED FOR STUDENTS WHO HAVE TAKEN YOGA BEFORE. THIS CLASS WILL HELP YOU TAKE YOUR PRACTICE TO THE NEXT LEVEL.',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Morning Yoga Flow',
        instructor: 'Jenny',
        day: 2, // Tuesday
        startTime: '8:00 AM',
        endTime: '8:45 AM',
        matsProvided: true,
        description: 'SIMPLE YOGA POSITIONS WITH FOCUS ON BREATHING EXERCISES, DEEP RELAXATION TO INCREASE FLEXIBILITY, AND INCREASED WELL-BEING. (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Gentle Yoga',
        instructor: 'Julia',
        day: 2, // Tuesday
        startTime: '7:30 PM',
        endTime: '8:30 PM',
        matsProvided: true,
        description: 'A GUIDED RESTFUL YOGA PRACTICE FOCUSED ON HOLDING POSES FOR LONGER DURATION TO HELP CALM YOUR MIND AND RELEASE TENSION IN YOUR MUSCLES. THIS CLASS WILL FOCUS ON SLOW MOVEMENTS, BREATHING TECHNIQUES, AND POSES. EMBRACE THE POWER OF REST. (LOW - MEDIUM IMPACT)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Rise & Shine Yoga',
        instructor: 'Julia',
        day: 3, // Wednesday
        startTime: '6:45 AM',
        endTime: '7:30 AM',
        matsProvided: true,
        description: 'SIMPLE YOGA POSITIONS WITH FOCUS ON BREATHING EXERCISES, DEEP RELAXATION TO INCREASE FLEXIBILITY, AND INCREASED WELL-BEING. (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Intermediate Yoga',
        instructor: 'Julia',
        day: 3, // Wednesday
        startTime: '7:30 PM',
        endTime: '8:30 PM',
        matsProvided: true,
        description: 'UTILIZING POSES TO HELP WITH STRENGTH AND FLEXIBILITY, THIS CLASS IS DESIGNED FOR STUDENTS WHO HAVE TAKEN YOGA BEFORE. THIS CLASS WILL HELP YOU TAKE YOUR PRACTICE TO THE NEXT LEVEL.',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Morning Yoga Flow',
        instructor: 'Jenny',
        day: 4, // Thursday
        startTime: '8:00 AM',
        endTime: '8:45 AM',
        matsProvided: true,
        description: 'SIMPLE YOGA POSITIONS WITH FOCUS ON BREATHING EXERCISES, DEEP RELAXATION TO INCREASE FLEXIBILITY, AND INCREASED WELL-BEING. (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Wake Up Flow',
        instructor: 'Teya',
        day: 6, // Saturday
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        matsProvided: true,
        description: 'SIMPLE YOGA POSITIONS WITH FOCUS ON BREATHING EXERCISES, DEEP RELAXATION TO INCREASE FLEXIBILITY, AND INCREASED WELL-BEING. (ALL LEVELS)',
        location: 'Chester E Peters Rec'
      },
      {
        className: 'Noontime Yoga',
        instructor: 'Dan',
        day: 2, // Tuesday
        startTime: '12:05 PM',
        endTime: '12:50 PM',
        matsProvided: false,
        description: 'A mindful midday break to stretch, breathe, and restore energy. Perfect for busy students and staff looking to reset during their lunch hour. (ALL LEVELS)',
        location: 'Multicultural Student Center'
      },
      {
        className: 'Noontime Yoga',
        instructor: 'Martha',
        day: 3, // Wednesday
        startTime: '12:05 PM',
        endTime: '12:50 PM',
        matsProvided: false,
        description: 'A mindful midday break to stretch, breathe, and restore energy. Perfect for busy students and staff looking to reset during their lunch hour. (ALL LEVELS)',
        location: 'Multicultural Student Center'
      },
      {
        className: 'Noontime Yoga',
        instructor: 'Kathryn',
        day: 4, // Thursday
        startTime: '12:05 PM',
        endTime: '12:50 PM',
        matsProvided: false,
        description: 'A mindful midday break to stretch, breathe, and restore energy. Perfect for busy students and staff looking to reset during their lunch hour. (ALL LEVELS)',
        location: 'Regnier Hall'
      },
      {
        className: 'Noontime Yoga',
        instructor: 'Ayumi',
        day: 5, // Friday
        startTime: '12:05 PM',
        endTime: '12:50 PM',
        matsProvided: false,
        description: 'A mindful midday break to stretch, breathe, and restore energy. Perfect for busy students and staff looking to reset during their lunch hour. (ALL LEVELS)',
        location: 'Multicultural Student Center'
      }
    ];

    // Generate all class instances
    const allClasses = [];
    for (const template of classTemplates) {
      const dates = generateClassDates(template.day, template.startTime, template.endTime);
      
      for (const date of dates) {
        allClasses.push({
          className: template.className,
          startTime: date.startTime,
          endTime: date.endTime,
          matsProvided: template.matsProvided,
          classDescription: template.description,
          isCancelled: false,
          instructorName: template.instructor,
          roomId: locationToRoomId[template.location]
        });
      }
    }

    // Insert all classes
    const insertedClasses = await db.insert(yogaClassesTable).values(allClasses).returning();
    
    console.log(`Inserted ${insertedClasses.length} yoga classes (~5 months of data)`);
    console.log('Seed completed successfully!');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed();