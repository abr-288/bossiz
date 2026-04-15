import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Routes protégées qui nécessitent une authentification
  const protectedRoutes = [
    '/subscriptions',
    '/majestic-subscription',
    '/payment',
    '/dashboard',
    '/profile',
    '/admin'
  ];
  
  // Vérifier si la route actuelle nécessite une authentification
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Routes publiques (pas de protection nécessaire)
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/about',
    '/contact',
    '/blog',
    '/services'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Si c'est une route protégée, vérifier l'authentification
  if (isProtectedRoute && !isPublicRoute) {
    const supabase = createClient();
    
    try {
      // Vérifier si l'utilisateur est authentifié
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // Rediriger vers la page de login avec l'URL de retour
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Vérifier si l'utilisateur a des informations de paiement
      // (uniquement pour les routes d'abonnement)
      if (pathname.includes('/subscriptions') || pathname.includes('/majestic-subscription')) {
        const { data: paymentMethods, error: paymentError } = await supabase
          .from('user_payment_methods')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (paymentError || !paymentMethods || paymentMethods.length === 0) {
          // Rediriger vers la page de configuration du paiement
          const paymentSetupUrl = new URL('/payment-setup', request.url);
          paymentSetupUrl.searchParams.set('redirectTo', pathname);
          return NextResponse.redirect(paymentSetupUrl);
        }
      }
      
      // Vérifier les permissions admin pour les routes admin
      if (pathname.startsWith('/admin')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (profileError || !profile || profile.role !== 'admin') {
          // Rediriger vers le dashboard si l'utilisateur n'est pas admin
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
      
    } catch (error) {
      console.error('Middleware error:', error);
      // En cas d'erreur, rediriger vers la page de login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
