export async function getRandomOtp() {
  const snap = await getDocs(collection(db, 'otps'))
  if (snap.empty) return null
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const random = list[Math.floor(Math.random() * list.length)]
  return random
}
