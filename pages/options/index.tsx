import AppLayout from "@/layouts/Layout";
import { useI18nStore } from "@/store/i18n";
import { useRouter } from "next/router";
import { ChangeEvent } from "react";

const UserProfile = () => {

    const { t, setCurrentLanguage, currentLanguage } = useI18nStore();

    const handleSelectedLanguageChanged = (e: ChangeEvent<HTMLSelectElement>) => {
        const language: string = e.currentTarget.value;
        setCurrentLanguage(language);
    };

    return (
        <AppLayout>
            <div className="m-8">
                <div className="card-header">{t("options.form.title")}</div>
                <div className="card-body">
                    <form className="w-[90%]">
                        <div className='w-full my-4'>
                            <div className='font-extrabold text-lg uppercase'>{t("options.form.language")}</div>
                            <select className='text-input'
                                required
                                value={currentLanguage}
                                onChange={handleSelectedLanguageChanged} >
                                <option value="en">English</option>
                                <option value="it">Italiano</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsche</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        {/* <div className="flex justify-between items-center">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}>
                <div>
                  <MdOutlineSave />
                </div>
                <div className="uppercase font-bold text-lg">{t("options.button.saveAccount")}</div>
              </button>
            </div> */}
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default UserProfile;