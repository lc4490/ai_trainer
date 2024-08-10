// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Hi{{name}}! I am your AI gym trainer. How can I help you today?",
      "send": "Send",
      "signIn": "Sign In",
      "signOut": "Sign Out",
      "trainerGPT": "trainerGPT",
      "Message": "Message",
      "language": "Language"
    }
  },
  cn: {
    translation: {
      "welcome": "嗨{{name}}！我是您的AI健身教练。今天有什么可以帮你的吗？",
      "send": "发",
      "signIn": "登入",
      "signOut": "登出",
      "trainerGPT": "教练GPT",
      "Message": "讯息",
      "language": "语言"
    }
  },
  tc: {
    translation: {
      "welcome": "嗨{{name}}！我是您的AI健身教練。今天有什麼可以幫你的吗？",
      "send": "發送",
      "signIn": "登入",
      "signOut": "登出",
      "trainerGPT": "教練GPT",
      "Message": "訊息",
      "language": "語言"
    }
  },
  es: {
    translation: {
      "welcome": "¡Hola{{name}}! Soy tu entrenador de gimnasio AI. ¿Cómo puedo ayudarte hoy?",
      "send": "Enviar",
      "signIn": "Iniciar sesión",
      "signOut": "Cerrar sesión",
      "trainerGPT": "entrenadorGPT",
      "Message": "Mensaje",
      "language": "Idioma"
    }
  },
  fr: {
    translation: {
      "welcome": "Salut{{name}}! Je suis votre entraîneur de gym IA. Comment puis-je vous aider aujourd'hui?",
      "send": "Envoyer",
      "signIn": "Se connecter",
      "signOut": "Se déconnecter",
      "trainerGPT": "entraineurGPT",
      "Message": "Message",
      "language": "Langue"
    }
  },
  de: {
    "translation": {
      "welcome": "Hallo{{name}}! Ich bin Ihr KI-Fitnesstrainer. Wie kann ich Ihnen heute helfen?",
      "send": "Senden",
      "signIn": "Anmelden",
      "signOut": "Abmelden",
      "trainerGPT": "trainerGPT",
      "Message": "Nachricht",
      "language": "Sprache"
    }
  },
  jp: {
    translation: {
      "welcome": "こんにちは{{name}}！私はあなたのAIジムトレーナーです。今日はどうされましたか？",
      "send": "送信",
      "signIn": "サインイン",
      "signOut": "サインアウト",
      "trainerGPT": "トレーナーGPT",
      "Message": "メッセージ",
      "language": "言語"
    }
  },
  kr: {
    translation: {
      "welcome": "안녕하세요{{name}}! 저는 당신의 AI 체육관 트레이너입니다. 오늘 어떻게 도와드릴까요?",
      "send": "보내다",
      "signIn": "로그인",
      "signOut": "로그아웃",
      "trainerGPT": "트레이너GPT",
      "Message": "메시지",
      "language": "언어"
    }
  }

  
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    keySeparator: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
