export type Canal = "whatsapp" | "sms" | "web" | "facebook" | "instagram" | "voz";

export interface CanalConfig {
  id: Canal;
  nombre: string;
  color: string;
  bgColor: string;
  icon: string;
  maxLength: number | null;
  soportaRichMedia: boolean;
}

export const CANALES: Record<Canal, CanalConfig> = {
  whatsapp: {
    id: "whatsapp",
    nombre: "WhatsApp",
    color: "#25D366",
    bgColor: "#dcf8c6",
    icon: "💬",
    maxLength: 4096,
    soportaRichMedia: true,
  },
  sms: {
    id: "sms",
    nombre: "SMS",
    color: "#5B5EA6",
    bgColor: "#e8e8f0",
    icon: "📱",
    maxLength: 160,
    soportaRichMedia: false,
  },
  web: {
    id: "web",
    nombre: "Web Chat",
    color: "#2563EB",
    bgColor: "#dbeafe",
    icon: "🌐",
    maxLength: null,
    soportaRichMedia: true,
  },
  facebook: {
    id: "facebook",
    nombre: "Facebook Messenger",
    color: "#1877F2",
    bgColor: "#e3f0ff",
    icon: "📘",
    maxLength: 2000,
    soportaRichMedia: true,
  },
  instagram: {
    id: "instagram",
    nombre: "Instagram DM",
    color: "#E4405F",
    bgColor: "#fce4ec",
    icon: "📸",
    maxLength: 1000,
    soportaRichMedia: true,
  },
  voz: {
    id: "voz",
    nombre: "Llamada de Voz",
    color: "#F59E0B",
    bgColor: "#fef3c7",
    icon: "📞",
    maxLength: null,
    soportaRichMedia: false,
  },
};

export function formatearMensaje(canal: Canal, mensaje: string): string {
  const config = CANALES[canal];
  if (config.maxLength && mensaje.length > config.maxLength) {
    return mensaje.substring(0, config.maxLength - 3) + "...";
  }
  return mensaje;
}
