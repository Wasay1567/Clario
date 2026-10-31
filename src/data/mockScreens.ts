import { SmsMessage } from '../types';

export const initialSmsMessages: SmsMessage[] = [
  {
    id: 'sms-1',
    sender: '8171-Ehsaas',
    time: '11:42 AM',
    body: 'Mubarak ho! BISP Ehsaas Program ki taraf se aapki 25,000 rupay ki mali imdad manzoor ho chuki hai. Fauran call karein aur apna biometric register karein: 0304-9876543. Officer Tariq Khan.',
    isScam: true,
  },
  {
    id: 'sms-2',
    sender: 'JazzCash-Sec',
    time: 'Yesterday',
    body: 'Aapka JazzCash account security reasons ki waja se 24 ghante mein block ho jayega. Account bachanay ke liye apna 4-digit PIN aur OTP is link par verify karein: bit.ly/jazz-unblock2026',
    isScam: true,
  },
  {
    id: 'sms-3',
    sender: 'Pakistan-Post',
    time: '2 days ago',
    body: 'Pakistan Post Notice: Aapka parcel customs clearance mein ruka hua hai. Delivery charges Rs 180 ada karne k liye link open karein: https://pakpost-clearance.xyz/pay',
    isScam: true,
  },
  {
    id: 'sms-4',
    sender: 'Bank-Alfalah',
    time: '3 days ago',
    body: 'Dear Customer, PKR 3,500.00 debited from account ending 4812 via POS Purchase at METRO CASH on 28-OCT. Available balance: PKR 42,120.50.',
    isScam: false,
  },
  {
    id: 'sms-5',
    sender: 'Telenor',
    time: '4 days ago',
    body: 'Aapka Easycard 850 kamyabi se lag chuka hai. 15GB data, 3000 Telenor mins, 300 other mins aglay 30 din k liye dastiyab hain. Balance maloomat k liye *444# milayein.',
    isScam: false,
  }
];

export const sampleVoiceQueries = {
  jazzcash: [
    { label: 'پیسے کیسے بھیجوں؟', text: 'Mujhe JazzCash se paise bhejne hain, samajh nahi aa raha kahan dabaoon', lang: 'ur' },
    { label: 'اکاؤنٹ کیوں بند ہو گیا؟', text: 'Mera JazzCash account lock ho gaya hai, biometric mang raha hai', lang: 'ur' },
    { label: 'بجلی کا بل بھرنا ہے', text: 'Mujhe bijli ka bill pay karna hai', lang: 'ur' },
  ],
  easypaisa: [
    { label: 'بینک میں پیسے بھیجنے ہیں', text: 'Easypaisa se bank account mein paise transfer karne hain', lang: 'ur' },
    { label: 'موبائل لوڈ کرنا ہے', text: 'Telenor sim par 500 ka mobile load karna hai', lang: 'ur' },
  ],
  whatsapp: [
    { label: 'ویڈیو کال کٹ گئی ہے', text: 'Video call cut ho gayi hai, reconnect kaise karoon?', lang: 'ur' },
    { label: 'میری آواز نہیں جا رہی', text: 'Call mein meri awaaz doosri taraf nahi jaa rahi', lang: 'ur' },
    { label: 'کیمرہ الٹا کیسے کروں؟', text: 'Peechay wala camera kaise on karein video call mein?', lang: 'ur' },
  ],
  messages: [
    { label: 'کیا یہ 8171 والا سچا ہے؟', text: 'Kya yeh 25000 wala message asli hai ya jhoota fraud hai?', lang: 'ur' },
    { label: 'جاز کیش بند ہونے والا میسج', text: 'Yeh message aya hai k account block ho jayega, kya karun?', lang: 'ur' },
  ],
  general: [
    { label: 'اسکرین پر کیا کرنا ہے؟', text: 'Mujhe samajh nahi aa raha is screen par kya dabaoon', lang: 'ur' },
    { label: 'فون ہینگ لگ رہا ہے', text: 'Phone par aage kaise badhoon?', lang: 'ur' }
  ]
};
