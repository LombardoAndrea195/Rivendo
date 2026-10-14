type PageKind = 'privacy' | 'terms'

const legalInfo = {
    operator: import.meta.env.VITE_LEGAL_OPERATOR_NAME?.trim() ?? '',
    address: import.meta.env.VITE_LEGAL_OPERATOR_ADDRESS?.trim() ?? '',
    supportEmail: import.meta.env.VITE_SUPPORT_EMAIL?.trim() ?? '',
    privacyEmail: import.meta.env.VITE_PRIVACY_EMAIL?.trim() ?? '',
    vatNumber: import.meta.env.VITE_LEGAL_VAT_NUMBER?.trim() ?? '',
}

const ready = Boolean(legalInfo.operator && legalInfo.address && legalInfo.supportEmail && legalInfo.privacyEmail)

function Contact({ email }: { email: string }) {
    return email ? <a href={`mailto:${email}`}>{email}</a> : <strong>Da configurare prima del lancio</strong>
}

function Layout({ children }: { children: React.ReactNode }) {
    return (
        <main className="public-page">
            <header className="public-page-head">
                <a className="brand" href="/" aria-label="Rivendo, pagina iniziale">
                    <span className="brand-mark" aria-hidden>R</span>
                    Rivendo
                </a>
                <nav className="legal-links" aria-label="Pagine legali">
                    <a href="/privacy">Privacy</a>
                    <a href="/terms">Termini</a>
                </nav>
            </header>
            <article className="public-copy">{children}</article>
        </main>
    )
}

export default function PublicPage({ kind }: { kind: PageKind }) {
    return (
        <Layout>
            {!ready && (
                <div className="notice launch-draft" role="status">
                    Bozza pre-lancio: completare titolare, indirizzo e recapiti nelle variabili VITE_LEGAL_* (file .env.production.local) prima di rendere pubblico il servizio.
                </div>
            )}
            {kind === 'privacy' ? (
                <>
                    <p className="eyebrow">RIVENDo / INFORMATIVA</p>
                    <h1>Informativa privacy</h1>
                    <p className="muted small">Aggiornata il 14 ottobre 2026</p>
                    <p>Questa bozza descrive il trattamento dei dati nell’app Rivendo. Prima del lancio il titolare deve verificarla e completare i dati identificativi e i recapiti.</p>
                    <h2>Titolare del trattamento</h2>
                    <p><strong>{legalInfo.operator || '[Nome o ragione sociale da configurare]'}</strong>{legalInfo.vatNumber && `, P. IVA ${legalInfo.vatNumber}`}</p>
                    <p>{legalInfo.address || '[Indirizzo completo da configurare]'}</p>
                    <p>Contatto privacy: <Contact email={legalInfo.privacyEmail} />. Assistenza: <Contact email={legalInfo.supportEmail} />.</p>
                    <h2>Nessun account, nessun archivio</h2>
                    <p>Rivendo non richiede registrazione e non conserva foto, testi, prezzi o chiavi API. Tutto ciò che inserisci resta nella memoria della pagina aperta nel tuo browser e viene cancellato quando la ricarichi o la chiudi. Il titolare non riceve né conserva questi contenuti.</p>
                    <h2>Funzione AI</h2>
                    <p>Quando premi “Genera annuncio”, fino a quattro foto e le note inserite vengono inviate direttamente dal tuo browser a Google Gemini o a OpenAI, usando la chiave API che hai inserito tu. Il prezzo di acquisto non viene inviato. Per quei dati si applicano le condizioni e l’informativa del fornitore scelto.</p>
                    <h2>Hosting</h2>
                    <p>Il sito è ospitato da Cloudflare, che tratta dati tecnici necessari a erogarlo e proteggerlo (per esempio indirizzo IP e registri di rete).</p>
                    <h2>Pubblicità e cookie</h2>
                    <p>Il sito è gratuito grazie a banner pubblicitari forniti da Google AdSense. Google e i suoi partner possono usare cookie e identificatori per mostrare e misurare gli annunci, anche personalizzati se presti il consenso. Puoi gestire le preferenze dal banner di consenso e su <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">adssettings.google.com</a>. Maggiori informazioni: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer">come Google utilizza i dati</a>.</p>
                    <h2>Diritti</h2>
                    <p>Per domande sul trattamento puoi scrivere a <Contact email={legalInfo.privacyEmail} />. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.</p>
                </>
            ) : (
                <>
                    <p className="eyebrow">RIVENDo / CONDIZIONI</p>
                    <h1>Termini di servizio</h1>
                    <p className="muted small">Bozza da verificare prima del lancio commerciale.</p>
                    <p>Rivendo è uno strumento gratuito che aiuta a preparare annunci di vendita per oggetti usati e a stimarne il prezzo. Non serve un account e nessun contenuto viene conservato.</p>
                    <h2>Funzioni AI e stime</h2>
                    <p>Testi, classificazioni e stime sono generati automaticamente e possono essere inesatti o incompleti. Non costituiscono valutazioni professionali né garanzie di vendita o di prezzo. Verifica sempre descrizioni, condizioni e prezzi prima di pubblicarli. L’uso della tua chiave API e i relativi costi sono a tuo carico.</p>
                    <h2>Servizi di terzi</h2>
                    <p>Vinted, Subito, eBay, Google Gemini e OpenAI sono servizi indipendenti con condizioni proprie. Rivendo non è affiliata a tali piattaforme e non pubblica automaticamente gli annunci. Non inserire dati personali di terzi nelle foto o nei testi senza averne titolo.</p>
                    <h2>Disponibilità</h2>
                    <p>Il servizio è fornito gratuitamente, così com’è. Poiché nulla viene salvato, copia il tuo annuncio prima di chiudere o ricaricare la pagina.</p>
                    <h2>Titolare e assistenza</h2>
                    <p><strong>{legalInfo.operator || '[Nome o ragione sociale da configurare]'}</strong>, {legalInfo.address || '[Indirizzo completo da configurare]'}{legalInfo.vatNumber && `, P. IVA ${legalInfo.vatNumber}`}.</p>
                    <p>Contatto: <Contact email={legalInfo.supportEmail} />.</p>
                </>
            )}
            <p className="legal-links"><a href="/privacy">Privacy</a><a href="/terms">Termini</a></p>
        </Layout>
    )
}