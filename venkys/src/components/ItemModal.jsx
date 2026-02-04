import { useState, useEffect } from 'react'
import { useUI } from '../context/UIContext'
import { useCart } from '../context/CartContext'
import { MdClose } from 'react-icons/md'

export default function ItemModal() {
  const { selectedItem, closeItem } = useUI()
  const { add } = useCart()
  
  // State for nested variants
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  // Initialize selection when item opens
  useEffect(() => {
    if (selectedItem?.variants?.length > 0) {
      // Check if it's nested (Item -> Groups -> Sizes) or flat (Item -> Sizes)
      const firstVariant = selectedItem.variants[0]
      const isNested = Array.isArray(firstVariant.sizes) && firstVariant.sizes.length > 0

      if (isNested) {
        setSelectedGroup(firstVariant)
        const validSizes = firstVariant.sizes.filter(s => (s.rate || s.price) > 0)
        setSelectedSize(validSizes[0] || null)
      } else {
        // Fallback for flat structure if any
        setSelectedGroup(null) // No grouping
        setSelectedSize(firstVariant)
      }
    } else {
      setSelectedGroup(null)
      setSelectedSize(null)
    }
  }, [selectedItem])

  const formatMoney = (value) => {
    const num = Number(value)
    if (!Number.isFinite(num)) return '0'
    const rounded = Math.round(num * 100) / 100
    const str = rounded.toFixed(2)
    return str.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  }

  const open = Boolean(selectedItem)
  if (!open) return null

  // Helper to detect structure
  const isNestedStructure = selectedItem.variants?.some(v => Array.isArray(v.sizes))

  // Determine effective values
    const currentVariant = selectedSize || selectedGroup // fallback if flat
    const effectivePrice = currentVariant 
        ? (currentVariant.rate || currentVariant.price || selectedItem.rate || selectedItem.price || 0)
        : (selectedItem.rate || selectedItem.price || 0)
    
  const effectiveMrp = currentVariant
    ? (currentVariant.mrp || selectedItem.mrp)
    : selectedItem.mrp
    
  const effectiveDiscount = currentVariant
    ? (currentVariant.discountPercent || selectedItem.discountPercent)
    : selectedItem.discountPercent

  const hasDiscount = Number.isFinite(Number(effectiveDiscount)) && Number(effectiveDiscount) > 0
  
  const discountLabel = hasDiscount
    ? `${(() => {
        const rounded = Math.round(Number(effectiveDiscount) * 10) / 10
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '')
      })()}% off`
    : null

  const displayImage = selectedItem.imageUrl || selectedItem.image || selectedItem.img
  const description = selectedItem.desc || selectedItem.description
  const components = Array.isArray(selectedItem.components) ? selectedItem.components : []
  const hasVariants = Array.isArray(selectedItem.variants) && selectedItem.variants.length > 0

  const onAdd = () => {
    if (!selectedItem) return

    if (hasVariants && !selectedSize && isNestedStructure) return
    if (hasVariants && !currentVariant && !isNestedStructure) return

    const baseItem = selectedItem
    let itemToAdd = { ...baseItem }

    if (hasVariants && (selectedSize || currentVariant)) {
        // Nested Structure: Group Name + Item Name -> Size
        // e.g. "Tandoori Chicken" (Variant: Half)
        
        let newName = baseItem.name
        let variantLabel = ''
        let uniqueSuffix = ''

        if (isNestedStructure && selectedGroup) {
            newName = `${selectedGroup.name} ${baseItem.name} (${selectedSize.name})`
            variantLabel = selectedSize.name
            uniqueSuffix = `${selectedGroup.name}_${selectedSize.name}`
        } else if (currentVariant) {
            // Flat: Item Name -> Variant
            // e.g. "Chicken Biryani (Half)"
            newName = `${baseItem.name} (${currentVariant.name})`
            variantLabel = currentVariant.name
            uniqueSuffix = currentVariant.name
        }

        const rate = currentVariant.rate || currentVariant.price || 0
        const mrp = currentVariant.mrp || 0
        const discount = currentVariant.discountPercent || 0

        // Sanitize ID
        const newId = `${baseItem.id}_${uniqueSuffix}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')

        itemToAdd = {
            ...baseItem,
            id: newId,
            name: newName, // "Tandoori Chicken"
            rate: rate,
            mrp: mrp,
            discountPercent: discount,
            variants: undefined,
            variantLabel: variantLabel // "Half"
        }
    } else {
         // Standard item add
         const resolvedId =
          baseItem.id ||
          baseItem.itemId ||
          baseItem._id ||
          baseItem.docId ||
          baseItem.sku ||
          `${baseItem.categoryId || ''}:${baseItem.name || ''}`
        
        if (resolvedId && baseItem.id !== resolvedId) {
            itemToAdd.id = resolvedId
        }
    }
    
    add(itemToAdd)
    closeItem()
  }

  return (
    <div className={`modal ${open ? 'modal-open' : ''} theme-vars`}>
      <div className="modal-box relative p-0 max-w-md overflow-hidden bg-base-100 rounded-3xl shadow-2xl no-scrollbar">
         {/* Close Button */}
         <button onClick={closeItem} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 bg-base-100/50 backdrop-blur-sm text-base-content hover:bg-base-100">
            <MdClose className="h-5 w-5" />
         </button>

         {/* Image Header */}
         <div className="relative aspect-[16/9] w-full bg-base-200">
             {displayImage ? (
                 <img src={displayImage} alt={selectedItem.name} className="h-full w-full object-cover" />
             ) : (
                <div className="grid h-full w-full place-items-center text-4xl">🍽️</div>
             )}
              {/* Badges Overlay */}
              <div className="absolute bottom-3 left-3 flex gap-2">
                 {selectedItem.veg !== undefined && (
                   <div className={`badge border-0 font-bold shadow-sm ${selectedItem.veg ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                     {selectedItem.veg ? 'VEG' : 'NON-VEG'}
                   </div>
                 )}
                 {hasDiscount && (
                   <div className="badge badge-secondary border-0 font-bold shadow-sm">{discountLabel}</div>
                 )}
              </div>
         </div>

         <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
             {/* Header */}
             <div>
                 <h3 className="text-xl font-bold text-base-content">{selectedItem.name}</h3>
                 <p className="mt-1 text-sm leading-relaxed text-base-content/70">{description}</p>
             </div>

             {/* Components/Ingredients */}
             {components.length > 0 && (
                <div className="rounded-xl bg-base-200/50 p-3">
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-base-content/50">Includes</h4>
                    <ul className="grid gap-2 text-sm">
                        {components.map((comp, i) => {
                             const text = typeof comp === 'object' ? (comp.text || comp.label) : comp
                             const qty = typeof comp === 'object' ? comp.qty : null
                             const unit = typeof comp === 'object' ? comp.unit : null
                             const displayLabel = [text, qty && unit ? `${qty}${unit}` : qty || unit].filter(Boolean).join(' · ')
                             
                             return (
                                 <li key={i} className="flex items-start gap-2 opacity-80">
                                     <span className="font-medium text-base-content/80">{displayLabel}</span>
                                 </li>
                             )
                        })}
                    </ul>
                </div>
             )}

             {/* Variant Groups (e.g. Flavor) */}
             {isNestedStructure && selectedItem.variants.length > 0 && (
                 <div className="space-y-3">
                     <h4 className="text-sm font-bold text-base-content">Select Variant</h4>
                     <div className="flex flex-wrap gap-2">
                         {selectedItem.variants.map((group, i) => {
                             const isSelected = selectedGroup && selectedGroup.name === group.name
                             return (
                                 <button 
                                     key={i}
                                     className={`btn btn-sm ${isSelected ? 'btn-neutral' : 'btn-outline border-base-300'}`}
                                     onClick={() => {
                                         setSelectedGroup(group)
                                         // Auto-select first size of new group to avoid invalid state
                                         const validSizes = group.sizes.filter(s => (s.rate || s.price) > 0)
                                         if (validSizes.length > 0) setSelectedSize(validSizes[0])
                                     }}
                                 >
                                     {group.name}
                                 </button>
                             )
                         })}
                     </div>
                 </div>
             )}

             {/* Sizes (e.g. Half/Full) */}
             {hasVariants && (
                 <div className="space-y-3">
                     <h4 className="text-sm font-bold text-base-content">Select Size</h4>
                     <div className="space-y-2">
                         {(() => {
                            // Decide which list to map: nested (group's sizes) or flat (item variants)
                            const listToMap = isNestedStructure 
                                ? (selectedGroup?.sizes || [])
                                : selectedItem.variants
                            
                            return listToMap.map((v, i) => {
                                 // Determine if selected
                                 const isSelected = isNestedStructure 
                                    ? (selectedSize && selectedSize.name === v.name)
                                    : (selectedSize && selectedSize.name === v.name) // reused selectedSize state for flat too

                                 const updateSelection = () => {
                                     setSelectedSize(v)
                                 }

                                 return (
                                     <label 
                                        key={i} 
                                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all
                                            ${isSelected 
                                                ? 'border-primary bg-primary/5 shadow-md' 
                                                : 'border-base-300 bg-base-100 hover:border-base-content/20'
                                            }
                                        `}
                                     >
                                         <div className="flex items-center gap-3">
                                             <input 
                                                type="radio" 
                                                name="size-select"
                                                className="radio radio-primary radio-sm"
                                                checked={isSelected}
                                                onChange={updateSelection}
                                             />
                                             <span className={`font-medium ${isSelected ? 'text-primary' : 'text-base-content'}`}>
                                                 {v.name}
                                             </span>
                                         </div>
                                         <div className="text-right">
                                             <span className="block font-bold text-base-content">₹{formatMoney(v.rate || v.price)}</span>
                                             {(v.mrp > (v.rate || v.price)) && (
                                                 <span className="block text-xs text-base-content/40 line-through">₹{formatMoney(v.mrp)}</span>
                                             )}
                                         </div>
                                     </label>
                                 )
                             })
                         })()}
                     </div>
                 </div>
             )}

             {/* Footer Actions */}
             <div className="pt-2 sticky bottom-0 bg-base-100 pb-2">
                 <div className="flex items-center justify-between mb-4">
                     <div>
                        <div className="text-xs text-base-content/50 uppercase tracking-wider">Rate</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-base-content">₹{formatMoney(effectivePrice)}</span>
                            {(Number(effectiveMrp) > Number(effectivePrice)) && (
                                <span className="text-sm text-base-content/40 line-through">₹{formatMoney(effectiveMrp)}</span>
                            )}
                        </div>
                     </div>
                 </div>
                 <button 
                    onClick={onAdd}
                    className="btn btn-primary btn-block shadow-lg shadow-primary/20 text-white"
                 >
                    Add to Cart {hasVariants ? `(${isNestedStructure && selectedGroup ? selectedGroup.name + ' ' : ''}${selectedSize ? selectedSize.name : ''})` : ''}
                 </button>
             </div>
         </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={closeItem}>
        <button>close</button>
      </form>
    </div>
  )
}
