import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simulatorService } from '../../services/simulatorService';

export function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <a className="flex items-center gap-2 text-lg font-semibold md:text-base" href="#">
            <span className="sr-only">HES System</span>
          </a>
          <a className="text-foreground transition-colors hover:text-foreground/80" href="#">
            Dashboard
          </a>
          <a className="text-muted-foreground transition-colors hover:text-foreground/80" href="#">
            Meters
          </a>
          <a className="text-muted-foreground transition-colors hover:text-foreground/80" href="#">
            Events
          </a>
          <a className="text-muted-foreground transition-colors hover:text-foreground/80" href="#">
            Settings
          </a>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Meters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Meters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">+1 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+4 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alarms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">-2 from yesterday</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4">
          <Tabs defaultValue="meters" className="w-full">
            <TabsList>
              <TabsTrigger value="meters">Meters</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
            </TabsList>
            <TabsContent value="meters" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Meter Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle>Meter 1</CardTitle>
                    <CardDescription>Serial: SM2000123456789</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <span className="text-green-500">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Reading</span>
                        <span>2 mins ago</span>
                      </div>
                      <Button className="w-full">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
                {/* Add more meter cards */}
              </div>
            </TabsContent>
            <TabsContent value="events" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Event List */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Power Failure</p>
                        <p className="text-sm text-muted-foreground">Meter 1</p>
                      </div>
                      <span className="text-sm text-muted-foreground">2 mins ago</span>
                    </div>
                    {/* Add more events */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="alarms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Alarms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Alarm List */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-500">High Voltage</p>
                        <p className="text-sm text-muted-foreground">Meter 2</p>
                      </div>
                      <span className="text-sm text-muted-foreground">5 mins ago</span>
                    </div>
                    {/* Add more alarms */}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 