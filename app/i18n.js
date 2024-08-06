// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Hi! I am your AI gym trainer. How can I help you today?",
      "send": "Send",
      "signIn": "Sign In",
      "signOut": "Sign Out",
      "trainerGPT": "trainerGPT",
      "Message": "Message",
    }
  },
  cn: {
    translation: {
      "welcome": "嗨！我是您的AI健身教练。今天有什么可以帮你的吗？",
      "send": "发",
      "signIn": "登入",
      "signOut": "登出",
      "trainerGPT": "教练GPT",
      "Message": "讯息",
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
