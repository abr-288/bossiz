import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  UnifiedForm,
  UnifiedAutocomplete,
  UnifiedFormField,
  UnifiedDatePicker,
  UnifiedSubmitButton,
} from "@/components/forms";
import { useTranslation } from "react-i18next";

export const TourSearchForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState<Date>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const guests = formData.get("guests") as string;
    const duration = formData.get("duration") as string;

    if (!destination) {
      return;
    }

    const params = new URLSearchParams({
      destination,
      ...(date && { date: format(date, "yyyy-MM-dd") }),
      guests,
      ...(duration && { duration }),
    });

    navigate(`/tours?${params.toString()}`);
  };

  return (
    <UnifiedForm onSubmit={handleSearch} variant="search" className="w-full max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="sm:col-span-2 lg:col-span-2 min-w-0">
          <UnifiedAutocomplete
            label={t("search.destination")}
            type="location"
            value={destination}
            onChange={setDestination}
            placeholder={t("search.location")}
            required
          />
        </div>

        <div className="min-w-0">
          <UnifiedDatePicker label={t("search.departure")} value={date} onChange={setDate} minDate={new Date()} />
        </div>

        <div className="min-w-0">
          <UnifiedFormField label={t("search.guests")} name="guests" type="number" defaultValue="2" min={1} max={20} />
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-end">
          <UnifiedSubmitButton fullWidth>{t("search.search")}</UnifiedSubmitButton>
        </div>
      </div>
    </UnifiedForm>
  );
};
