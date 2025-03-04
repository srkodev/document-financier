
import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataCard from "@/components/ui-custom/DataCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRole } from "@/types";

const Settings = () => {
  // Mock user data (in a real app, this would come from an auth context)
  const mockUser = {
    id: "user1",
    name: "Alex Dubois",
    email: "alex.dubois@example.com",
    role: UserRole.ADMIN,
    avatarUrl: ""
  };
  
  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Paramètres</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <DataCard title="Photo de profil">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={mockUser.avatarUrl} />
                      <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                        {mockUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">Changer</Button>
                      <Button variant="ghost" size="sm" className="text-destructive">Supprimer</Button>
                    </div>
                  </div>
                </DataCard>
              </div>
              
              <div className="md:col-span-2">
                <DataCard title="Informations personnelles">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" defaultValue={mockUser.name.split(' ')[0]} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" defaultValue={mockUser.name.split(' ')[1]} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue={mockUser.email} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rôle</Label>
                      <Input id="role" value={mockUser.role} disabled />
                    </div>
                    
                    <div className="pt-4">
                      <Button>Enregistrer les modifications</Button>
                    </div>
                  </div>
                </DataCard>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="account" className="mt-0">
            <DataCard title="Paramètres du compte">
              <p className="py-4 text-center text-muted-foreground">Paramètres du compte en cours d'implémentation.</p>
            </DataCard>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            <DataCard title="Préférences de notification">
              <p className="py-4 text-center text-muted-foreground">Préférences de notification en cours d'implémentation.</p>
            </DataCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
