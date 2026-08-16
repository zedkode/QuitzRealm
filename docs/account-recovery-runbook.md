# Recuperarea manuală a unui cont

> Procedură operațională pentru `owner-plan.md` §1.4. Aceasta este o **recuperare prin suport**, nu un endpoint automat și nu trebuie executată din chat sau social media.

## Când se folosește

Fluxul se folosește doar dacă jucătorul nu mai are acces simultan la adresa de email și la al doilea factor. Dacă emailul rămâne accesibil, se folosește mai întâi resetarea normală a parolei; dacă unul dintre codurile de recuperare 2FA există, se folosește acel cod.

| Etapă | Control obligatoriu | Rezultat |
|---|---|---|
| Deschiderea cererii | Număr de ticket; nu se discută detalii publice | Caz urmărit și auditabil |
| Dovada emailului | Răspuns la un email trimis la adresa înregistrată **sau** verificare a ultimei adrese confirmate | Nu se divulgă dacă un nume de jucător are cont |
| Dovada istorică | Minimum două informații independente, de exemplu luna creării contului, dispozitiv folosit recent și identificatorul unei tranzacții | Reduce furtul de cont prin inginerie socială |
| Perioada de protecție | Cererea este marcată 72 h în așteptare și jucătorul este informat pe toate canalele încă disponibile | Oferă timp proprietarului legitim să conteste |
| Acțiune operator | Operatorul revocă toate sesiunile, resetează 2FA și emite un link de resetare pe emailul verificat | Niciodată nu trimite parola sau coduri 2FA în clar |
| Închidere | Jucătorul configurează parolă nouă, 2FA nou și salvează coduri recovery; ticketul păstrează doar metadate | Urmărire și investigație ulterioară |

## Cerințe pentru operator

Operatorul nu schimbă adresa de email doar pe baza unei capturi de ecran, a unui nume de utilizator sau a unei afirmații privind inventarul. Orice acțiune de recuperare se notează cu ID-ul operatorului, timestamp, metodele de verificare folosite și ID-ul intern al contului. Conținutul mesajelor, parolele și codurile 2FA nu se atașează în ticket.

> Pentru implementarea Admin Panel din punctul 13, acțiunea trebuie să folosească `SessionService.revokeAll(userId)` și să invalideze secretul 2FA în aceeași tranzacție de audit.
