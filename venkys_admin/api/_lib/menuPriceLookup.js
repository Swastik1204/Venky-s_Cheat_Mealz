/* eslint-env node */
// Server-side menu price index shared by place-order.js and create-order.js.
// Keep byte-identical with venkys_admin/api/_lib/menuPriceLookup.js (and vice versa).
//
// Cart item names are built client-side in venkys/src/components/ItemModal.jsx:
//   plain item              -> "<item>"
//   flat variant            -> "<item> (<variant>)"          variantLabel = <variant>
//   nested group -> size    -> "<group> <item> (<size>)"     variantLabel = <size>
// menu/{category}.items[] carries those as item.variants[] (flat: {name, rate})
// or item.variants[].sizes[] (nested). The index is keyed on exactly those
// display names so a sized item resolves to its real size rate, and anything
// not on the menu stays unresolved (caller rejects it for non-POS orders).

const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
// Same falsy-fallback ItemModal uses when it picks the rate it puts in the cart.
const rateOf = (o, fallback = 0) => Number(o?.rate || o?.price || fallback) || 0

function setOnce(map, key, rate) {
  if (key && !map.has(key)) map.set(key, rate)
}

export function buildMenuPriceLookup(menuDocs) {
  const lookup = new Map()
  for (const catDoc of menuDocs) {
    const data = typeof catDoc?.data === 'function' ? catDoc.data() : catDoc
    const catItems = Array.isArray(data?.items) ? data.items : []
    for (const item of catItems) {
      const name = norm(item?.name)
      if (!name) continue
      const baseRate = Number(item.rate ?? item.price ?? 0) || 0
      setOnce(lookup, name, baseRate)
      if (!Array.isArray(item.variants)) continue
      for (const v of item.variants) {
        const vName = norm(v?.label || v?.name)
        if (Array.isArray(v?.sizes) && v.sizes.length) {
          for (const s of v.sizes) {
            const sName = norm(s?.label || s?.name)
            const sRate = rateOf(s)
            if (!sName || sRate <= 0) continue // ItemModal never offers a zero-rate size
            setOnce(lookup, `${vName ? `${vName} ` : ''}${name} (${sName})`, sRate)
            setOnce(lookup, `${name}::${vName}::${sName}`, sRate)
          }
        } else if (vName) {
          const vRate = rateOf(v, baseRate)
          setOnce(lookup, `${name} (${vName})`, vRate)
          setOnce(lookup, `${name}::${vName}`, vRate)
        }
      }
    }
  }
  return lookup
}

// Returns the server rate for a cart line, or undefined when it is not on the menu.
export function lookupMenuRate(lookup, itemName, variantLabel) {
  const name = norm(itemName)
  const label = norm(variantLabel)
  if (label) {
    // Sized line: must match the full display name or base::label — never the
    // bare base price, or a "(Full)" line could be priced as the base item.
    if (lookup.has(name)) {
      const suffix = ` (${label})`
      if (name.endsWith(suffix)) return lookup.get(name)
    }
    if (lookup.has(`${name}::${label}`)) return lookup.get(`${name}::${label}`)
    return undefined
  }
  return lookup.get(name)
}
