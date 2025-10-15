import { useTranslation } from "react-i18next";

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const setLang = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium px-3">
      <button
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded ${
          current === 'en' ? 'bg-secondary text-white' : 'text-gray-700'
        }`}
      >
        EN
      </button>
      <span className="text-gray-400">|</span>
      <button
        onClick={() => setLang('el')}
        className={`px-3 py-1 rounded ${
          current === 'el' ? 'bg-secondary text-white' : 'text-gray-700'
        }`}
      >
        EL
      </button>
    </div>
  );
};

export default LanguageSelector;
