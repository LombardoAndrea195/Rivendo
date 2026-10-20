(() => {
  const TRANSFER_SOURCE = 'rivendo'
  const MAX_ATTEMPTS = 30
  let filled = false

  const normalise = (value) => (value || '').toLowerCase().replace(/\s+/g, ' ').trim()

  const setNativeValue = (element, value) => {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
    setter?.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
    element.dispatchEvent(new Event('blur', { bubbles: true }))
  }

  const visible = (element) => Boolean(element?.offsetParent)

  const fieldFor = (labels) => {
    const candidates = [...document.querySelectorAll('input:not([type="hidden"]), textarea')].filter(visible)
    return candidates.find((field) => {
      const aria = field.getAttribute('aria-label') || ''
      const placeholder = field.getAttribute('placeholder') || ''
      const name = field.getAttribute('name') || ''
      const id = field.id ? document.querySelector(`label[for="${CSS.escape(field.id)}"]`)?.textContent || '' : ''
      const context = normalise(`${aria} ${placeholder} ${name} ${id} ${field.closest('label, [data-testid], div')?.textContent || ''}`)
      return labels.some((label) => context.includes(label))
    })
  }

  const fillTextFields = (data) => {
    const values = [
      [['titolo', 'title'], data.title],
      [['descrizione', 'description'], data.description],
      [['prezzo', 'price'], data.price == null ? '' : String(data.price).replace('.', ',')],
    ]
    let count = 0
    for (const [labels, value] of values) {
      if (!value) continue
      const field = fieldFor(labels)
      if (field) {
        setNativeValue(field, value)
        count += 1
      }
    }
    return count
  }

  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

  const chooseOption = async (labels, value) => {
    if (!value) return false
    const labelText = labels.map(normalise)
    const controls = [...document.querySelectorAll('button, [role="button"], [role="combobox"]')].filter(visible)
    const control = controls.find((element) => {
      const context = normalise(`${element.getAttribute('aria-label') || ''} ${element.textContent || ''} ${element.closest('label, div')?.textContent || ''}`)
      return labelText.some((label) => context.includes(label))
    })
    if (!control) return false

    control.click()
    await wait(200)
    const target = normalise(value)
    const options = [...document.querySelectorAll('[role="option"], [role="menuitem"], li, button')].filter(visible)
    const option = options.find((element) => {
      const text = normalise(element.textContent)
      return text === target || text.startsWith(`${target} `) || target.startsWith(`${text} `)
    })
    if (!option) return false
    option.click()
    return true
  }

  const showNotice = (message, error = false) => {
    if (document.getElementById('rivendo-vinted-notice')) return
    const notice = document.createElement('div')
    notice.id = 'rivendo-vinted-notice'
    notice.textContent = message
    Object.assign(notice.style, {
      position: 'fixed', right: '16px', bottom: '16px', zIndex: '2147483647', maxWidth: '340px', padding: '12px 14px',
      borderRadius: '8px', color: '#fff', background: error ? '#b4382f' : '#1f6f50', font: '14px system-ui, sans-serif', boxShadow: '0 6px 20px rgb(0 0 0 / .2)',
    })
    document.body.append(notice)
    setTimeout(() => notice.remove(), 7000)
  }

  const getTransfer = async () => {
    const raw = await navigator.clipboard.readText()
    const parsed = JSON.parse(raw)
    return parsed?.source === TRANSFER_SOURCE && parsed?.version === 1 ? parsed : null
  }

  const run = async (providedData) => {
    if (filled) return true
    try {
      const data = providedData || (await getTransfer())
      if (!data) return false
      let count = fillTextFields(data)
      for (const [labels, value] of [
        [['marca', 'brand'], data.brand],
        [['taglia', 'misura', 'size'], data.size],
        [['categoria', 'category'], data.category],
        [['condizioni', 'condition', 'stato'], data.condition],
      ]) {
        if (await chooseOption(labels, value)) count += 1
      }
      if (!count) return false
      filled = true
      showNotice(`Rivendo ha compilato ${count} campi. Controlla i dati, aggiungi le foto e premi Pubblica.`)
      return true
    } catch {
      return false
    }
  }

  let attempts = 0
  if (!window.location.pathname.includes('/items/new')) return
  const extension = globalThis.browser || globalThis.chrome
  extension?.runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'RIVENDO_FILL' || !message.data) return
    run(message.data).then((success) => sendResponse({ success }))
    return true
  })
  const timer = setInterval(async () => {
    attempts += 1
    if ((await run()) || attempts >= MAX_ATTEMPTS) clearInterval(timer)
  }, 500)
})()
