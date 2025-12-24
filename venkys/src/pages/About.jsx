import logo from '../assets/logo.png'

export default function About() {
  return (
  <div className="page-wrap py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center gap-3">
          <img src={logo} alt="Venky's" className="h-10 w-auto object-contain" />
          <h1 className="text-4xl font-bold">About</h1>
        </div>
        <p className="leading-7 opacity-90">
          We’re a local kitchen serving freshly prepared dishes with authentic flavors.
          Our mission is to bring great food to your doorstep quickly and affordably.
        </p>
      </div>
    </div>
  )
}
