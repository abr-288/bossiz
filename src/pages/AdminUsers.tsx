import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, Mail, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: string | null;
  avatar_url?: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer les profils depuis la table profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des profils:', error);
        toast.error('Erreur lors de la récupération des utilisateurs');
        return;
      }

      setUsers(profiles || []);
      setFilteredUsers(profiles || []);
      
      console.log('Utilisateurs trouvés:', profiles?.length || 0);
      console.log('Détails:', profiles);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>;
      case 'agent':
        return <Badge className="bg-blue-500">Agent</Badge>;
      case 'user':
        return <Badge className="bg-green-500">Utilisateur</Badge>;
      default:
        return <Badge variant="outline">Non défini</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground">
              {filteredUsers.length} utilisateur(s) trouvé(s)
            </p>
          </div>
        </div>
        <Button onClick={fetchUsers} disabled={loading}>
          {loading ? 'Chargement...' : 'Actualiser'}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche
          </CardTitle>
          <CardDescription>
            Rechercher par email, nom ou téléphone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Liste des Utilisateurs
          </CardTitle>
          <CardDescription>
            Tous les utilisateurs inscrits sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">
                        {user.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.full_name || (
                          <span className="text-muted-foreground italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.phone || (
                          <span className="text-muted-foreground italic">Non renseigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(user.updated_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="mt-6 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Informations de Débogage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-yellow-800">
            <p><strong>Total d'utilisateurs:</strong> {users.length}</p>
            <p><strong>Utilisateurs filtrés:</strong> {filteredUsers.length}</p>
            <p><strong>Terme de recherche:</strong> "{searchTerm}"</p>
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">Voir les données brutes</summary>
              <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-x-auto">
                {JSON.stringify(filteredUsers, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
