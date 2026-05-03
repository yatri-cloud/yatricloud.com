/**
 * Exam Dumps Integration Service
 */

const EXAM_DUMPS_WEBHOOK_URL = import.meta.env.VITE_EXAM_DUMPS_WEBHOOK_URL || "";

export interface ExamDump {
  id: string;
  title: string;
  provider: string;
  originalPrice: number;
  price: number;
  image: string;
  downloadUrl: string;
  description: string;
  status?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const PROXY_URL = `${API_BASE_URL}/api/exam-dumps`;

/**
 * Fetch exam dumps from Google Sheets
 */
export async function fetchExamDumps(): Promise<ExamDump[]> {
  try {
    const response = await fetch(PROXY_URL, {
      method: "GET",
    });

    if (!response.ok) return [];

    const data = await response.json();
    let dumps: ExamDump[] = [];
    
    if (data.dumps && Array.isArray(data.dumps)) {
      dumps = data.dumps;
    } else if (Array.isArray(data)) {
      dumps = data;
    }

    return dumps.map((dump: any) => ({
      id: dump.id || `dump-${Date.now()}`,
      title: dump.title || '',
      provider: dump.provider || '',
      originalPrice: parseFloat(dump.originalPrice ?? dump.originalprice ?? 0),
      price: parseFloat(dump.price ?? 0),
      image: dump.image || '',
      downloadUrl: dump.downloadUrl || dump.downloadurl || '',
      description: dump.description || '',
      status: dump.status || 'active',
    })).filter(d => d.status === 'active');
    
  } catch (error) {
    console.error("❌ Error fetching exam dumps:", error);
    return [];
  }
}

/**
 * Submit exam dump to Google Sheets
 */
export async function submitExamDump(dump: Omit<ExamDump, 'id' | 'status'>): Promise<void> {
  try {
    await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...dump,
        action: 'add',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('❌ Error submitting exam dump:', error);
    throw error;
  }
}
