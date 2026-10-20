const extension = globalThis.browser || globalThis.chrome
const button = document.getElementById('fill')
const status = document.getElementById('status')

const setStatus = (message, error = false) => {
  status.textContent = message
  status.className = error ? 'error' : ''
}

button.addEventListener('click', async () => {
  button.disabled = true
  setStatus('Leggo i dati da Rivendo…')
  try {
    const raw = await navigator.clipboard.readText()
    const data = JSON.parse(raw)
    if (data?.source !== 'rivendo' || data?.version !== 1) throw new Error('Apri prima Rivendo e premi “Pubblica su Vinted”.')

    const [tab] = await extension.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !/^https:\/\/(www\.)?vinted\.(it|com)\/(?:.*\/)?items\/new/.test(tab.url || '')) {
      throw new Error('Apri prima la pagina per creare un annuncio su Vinted.')
    }
    const response = await extension.tabs.sendMessage(tab.id, { type: 'RIVENDO_FILL', data })
    if (!response?.success) throw new Error('I campi Vinted non sono ancora pronti: attendi un momento e riprova.')
    setStatus('Annuncio compilato. Controllalo prima di pubblicare.')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Impossibile compilare l’annuncio.', true)
  } finally {
    button.disabled = false
  }
})
