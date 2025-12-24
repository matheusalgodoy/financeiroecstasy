import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'sales.json');
const METADATA_FILE = path.join(DATA_DIR, 'metadata.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface Sale {
  id: string;
  name: string;
  value: number;
  buyer: string;
  status: 'pending' | 'delivered' | 'cancelled';
}

export interface Metadata {
  discordMessageId?: string;
}

export function getSales(): Sale[] {
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export function saveSales(sales: Sale[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sales, null, 2));
}

export function getMetadata(): Metadata {
  if (!fs.existsSync(METADATA_FILE)) {
    return {};
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export function saveMetadata(metadata: Metadata) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
}
