import { Outlet, NavLink } from 'react-router-dom';

const adminLinks = [
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/roles', label: 'Roles' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/wishlist', label: 'Wishlist' },
  { to: '/admin/coupons', label: 'Coupons' },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-900 text-white">
        <div className="p-6 text-lg font-bold">Admin Panel</div>
        <nav className="flex flex-col gap-1 px-3">
          {adminLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
