import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Privacy = () => {
  const { t, i18n } = useTranslation();
  const isPl = i18n.language === "pl";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {t("common.backToHome")}
          </Link>
          <LanguageSwitcher />
        </div>

        <article className="prose prose-sm max-w-none text-foreground">
          {isPl ? (
            <>
              <h1 className="text-3xl font-bold mb-2">Polityka Prywatności</h1>
              <p className="text-muted-foreground mb-8">Ostatnia aktualizacja: 16 marca 2026</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">1. Administrator danych</h2>
              <p>Administratorem Twoich danych osobowych jest idealniepasuje. Kontakt w sprawie danych: <strong>idealnyserwisrekrutacyjny@gmail.com</strong>.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">2. Jakie dane zbieramy</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dane rejestracyjne: imię i nazwisko, adres e-mail, nazwa firmy (pracodawcy)</li>
                <li>Wyniki testów kompetencji i kultury organizacji</li>
                <li>Informacje o doświadczeniu zawodowym, branży, trybie pracy</li>
                <li>Adres URL profilu LinkedIn (opcjonalnie)</li>
                <li>Opinie i feedback</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">3. Cel przetwarzania danych</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Świadczenie usługi dopasowania kandydatów z pracodawcami</li>
                <li>Komunikacja z użytkownikami (powiadomienia e-mail)</li>
                <li>Doskonalenie algorytmu dopasowania</li>
                <li>Zapewnienie bezpieczeństwa kont użytkowników</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">4. Podstawa prawna</h2>
              <p>Przetwarzamy dane na podstawie:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Zgody użytkownika (art. 6 ust. 1 lit. a RODO)</li>
                <li>Wykonania umowy o świadczenie usługi (art. 6 ust. 1 lit. b RODO)</li>
                <li>Prawnie uzasadnionego interesu administratora (art. 6 ust. 1 lit. f RODO)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">5. Okres przechowywania danych</h2>
              <p>Dane przechowujemy przez okres korzystania z usługi. Po usunięciu konta wszystkie dane powiązane z kontem są trwale usuwane.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">6. Twoje prawa</h2>
              <p>Na podstawie RODO przysługują Ci następujące prawa:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Prawo dostępu</strong> – możesz żądać informacji o przetwarzanych danych</li>
                <li><strong>Prawo do sprostowania</strong> – możesz poprawić swoje dane</li>
                <li><strong>Prawo do usunięcia</strong> – możesz usunąć konto i wszystkie dane</li>
                <li><strong>Prawo do przenoszenia danych</strong> – możesz żądać eksportu danych</li>
                <li><strong>Prawo do cofnięcia zgody</strong> – w dowolnym momencie</li>
                <li><strong>Prawo do złożenia skargi</strong> – do Prezesa UODO</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">7. Bezpieczeństwo danych</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Szyfrowanie danych w tranzycie (TLS/HTTPS)</li>
                <li>Szyfrowanie danych w spoczynku (AES-256)</li>
                <li>Hashowanie haseł (bcrypt z salt)</li>
                <li>Polityki bezpieczeństwa na poziomie wierszy (RLS)</li>
                <li>Regularne kopie zapasowe bazy danych</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">8. Udostępnianie danych</h2>
              <p>Twoje dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych. Dane kandydatów są udostępniane pracodawcom wyłącznie w ramach procesu dopasowania, zgodnie z zasadą minimalizacji.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">9. Pliki cookies</h2>
              <p>Używamy wyłącznie niezbędnych plików cookies do utrzymania sesji logowania. Nie stosujemy plików cookies marketingowych ani śledzących.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">10. Kontakt</h2>
              <p>W sprawach związanych z ochroną danych osobowych skontaktuj się z nami: <strong>idealnyserwisrekrutacyjny@gmail.com</strong></p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-muted-foreground mb-8">Last updated: March 16, 2026</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">1. Data Controller</h2>
              <p>The controller of your personal data is idealniepasuje. Contact for data matters: <strong>idealnyserwisrekrutacyjny@gmail.com</strong>.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">2. Data We Collect</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Registration data: full name, email address, company name (employers)</li>
                <li>Competency and organizational culture test results</li>
                <li>Work experience, industry, work mode information</li>
                <li>LinkedIn profile URL (optional)</li>
                <li>Feedback and opinions</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">3. Purpose of Processing</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Providing candidate-employer matching services</li>
                <li>Communication with users (email notifications)</li>
                <li>Improving the matching algorithm</li>
                <li>Ensuring user account security</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">4. Legal Basis</h2>
              <p>We process data based on:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>User consent (Art. 6(1)(a) GDPR)</li>
                <li>Performance of a contract (Art. 6(1)(b) GDPR)</li>
                <li>Legitimate interest (Art. 6(1)(f) GDPR)</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">5. Data Retention</h2>
              <p>We store data for the duration of service use. Upon account deletion, all associated data is permanently removed.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">6. Your Rights</h2>
              <p>Under GDPR, you have the following rights:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Right of access</strong> – request information about processed data</li>
                <li><strong>Right to rectification</strong> – correct your data</li>
                <li><strong>Right to erasure</strong> – delete your account and all data</li>
                <li><strong>Right to data portability</strong> – request data export</li>
                <li><strong>Right to withdraw consent</strong> – at any time</li>
                <li><strong>Right to lodge a complaint</strong> – with a supervisory authority</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">7. Data Security</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Data encrypted in transit (TLS/HTTPS)</li>
                <li>Data encrypted at rest (AES-256)</li>
                <li>Password hashing (bcrypt with salt)</li>
                <li>Row-level security policies (RLS)</li>
                <li>Regular database backups</li>
              </ul>

              <h2 className="text-xl font-semibold mt-8 mb-3">8. Data Sharing</h2>
              <p>Your data is never sold or shared with third parties for marketing purposes. Candidate data is shared with employers only within the matching process, following the principle of data minimization.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">9. Cookies</h2>
              <p>We only use essential cookies for session management. We do not use marketing or tracking cookies.</p>

              <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
              <p>For data protection inquiries, contact us at: <strong>kontakt@idealniepasuje.pl</strong></p>
            </>
          )}
        </article>
      </div>
    </div>
  );
};

export default Privacy;
