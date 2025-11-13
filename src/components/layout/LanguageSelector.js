import { useTranslation } from "react-i18next";

const LanguageSelector = ({ className = "" }) => {
  const { i18n } = useTranslation();
  const current = i18n.language;

  const setLang = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const options = [
    { value: 'en', label: 'EN' },
    { value: 'el', label: 'EL' },
  ];

  return (
    <div className={`inline-flex items-center text-sm font-medium ${className}`}>
      <select
        value={current}
        onChange={setLang}
        // Tailwind classes for styling the select
        className="block w-full py-1.5 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary text-sm font-medium"
        aria-label="Select Language"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;