import React from 'react'

function themeToReffer() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

  {/* <!-- LIGHT THEME --> */}
  <div className="p-8 space-y-4 bg-stone-50 text-slate-900">
    <h2 className="font-bold text-lg">Light Theme</h2>

    {/* <!-- Primary Accents --> */}
    <div className="h-12 bg-cyan-500"></div>
    <div className="h-12 bg-emerald-500"></div>

    {/* <!-- Soft Accents --> */}
    <div className="h-12 bg-cyan-100"></div>
    <div className="h-12 bg-emerald-100"></div>

    {/* <!-- Neutrals --> */}
    <div className="h-12 bg-stone-300"></div>
    <div className="h-12 bg-slate-900"></div>
  </div>

  {/* <!-- DARK THEME --> */}
  <div className="p-8 space-y-4 bg-slate-950 text-slate-100">
    <h2 className="font-bold text-lg">Dark Theme</h2>

    {/* <!-- Primary Accents --> */}
    <div className="h-12 bg-cyan-400"></div>
    <div className="h-12 bg-emerald-400"></div>

    {/* <!-- Deep Accents --> */}
    <div className="h-12 bg-cyan-900"></div>
    <div className="h-12 bg-emerald-900"></div>

    {/* <!-- Neutrals --> */}
    <div className="h-12 bg-slate-900"></div>
    <div className="h-12 bg-slate-100"></div>
  </div>

</div>

  )
}

export default themeToReffer