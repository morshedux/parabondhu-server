import { Db, MongoClient, ObjectId } from "mongodb";

export interface EventDoc {
  _id?: ObjectId;
  title: string;
  description: string;
  eventType: string;
  thumbnail: string;
  location: string;
  eventDate: Date;
  creatorEmail: string;
  creatorName: string;
  createdAt: Date;
}

export interface JoinDoc {
  _id?: ObjectId;
  eventId: ObjectId;
  eventTitle: string;
  eventType: string;
  eventLocation: string;
  eventDate: Date;
  userEmail: string;
  userName: string;
  joinedAt: Date;
}

let dbPromise: Promise<Db> | null = null;

async function connect(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  const client = await new MongoClient(uri).connect();
  const db = client.db(process.env.DB_NAME || "parabondhu");

  await Promise.all([
    db.collection("events").createIndex({ eventDate: 1 }),
    db.collection("events").createIndex({ creatorEmail: 1 }),
    db.collection("joins").createIndex({ eventId: 1, userEmail: 1 }, { unique: true }),
  ]);
  return db;
}

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = connect().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

export async function eventsCollection() {
  return (await getDb()).collection<EventDoc>("events");
}

export async function joinsCollection() {
  return (await getDb()).collection<JoinDoc>("joins");
}
