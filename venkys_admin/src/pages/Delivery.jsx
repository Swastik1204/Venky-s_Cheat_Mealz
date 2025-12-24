import { useAuth } from '../context/AuthContext'

export default function Delivery() {
  const { user, role } = useAuth()

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
          <div>
            <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
            <p className="text-base-content/60">Manage your deliveries and routes</p>
          </div>
          <div className="badge badge-primary badge-lg gap-2">
            <span className="w-2 h-2 rounded-full bg-white/50"></span>
            {role?.role || 'Delivery Partner'}
          </div>
        </div>

        {/* Map Section Placeholder */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-0 overflow-hidden rounded-2xl">
            <div className="h-[400px] w-full bg-base-200 flex items-center justify-center relative group">
              <div className="text-center p-6">
                <div className="text-4xl mb-2">🗺️</div>
                <h3 className="font-medium text-lg">Map View</h3>
                <p className="text-sm opacity-60 max-w-xs mx-auto mt-1">
                  Google Maps integration will appear here to show delivery routes and locations.
                </p>
                <button className="btn btn-primary btn-sm mt-4">
                  Open in Google Maps
                </button>
              </div>
              
              {/* Mock Map Grid Background */}
              <div className="absolute inset-0 opacity-5 pointer-events-none" 
                style={{
                  backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Deliveries List */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">Active Deliveries</h2>
            <div className="text-center py-8 opacity-60">
              <p>No active deliveries assigned.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
