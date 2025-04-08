'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="text-purple-600">UCalgaryConnect</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Login
              </Link>
              <Link href="/register">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-purple-50/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-10">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                  Connect with Fellow <span className="text-purple-600">UCalgary</span> Students
                </h1>
                <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
                  Find study partners, join projects, and collaborate with students who share your interests and goals.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 pt-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-6 w-full sm:w-auto">
                      Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/find-partners">
                    <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6 w-full sm:w-auto">
                      Find Partners
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600/20 rounded-3xl blur-3xl" />
                <div className="relative bg-white rounded-2xl shadow-xl p-8">
                  <div className="space-y-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                        <svg className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Find Study Partners</h3>
                        <p className="text-gray-600">Connect with students in your courses</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                        <svg className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Share Skills</h3>
                        <p className="text-gray-600">Learn from and teach others</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
                        <svg className="h-7 w-7 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Join Projects</h3>
                        <p className="text-gray-600">Collaborate on exciting initiatives</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose UCalgaryConnect?</h2>
            <p className="text-xl text-gray-600">
              We make it easy to connect with fellow students and enhance your academic experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-gray-100 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Find Study Partners</CardTitle>
                <CardDescription className="text-gray-600">Connect with students in your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Easily find and connect with students taking the same courses as you. Form study groups and collaborate on assignments.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-100 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Share Skills</CardTitle>
                <CardDescription className="text-gray-600">Learn from and teach others</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Share your expertise and learn from others. Whether you&apos;re looking to teach or learn, find the perfect match.
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-100 hover:border-purple-200 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Join Projects</CardTitle>
                <CardDescription className="text-gray-600">Collaborate on exciting initiatives</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Discover and join projects that match your interests. From hackathons to research projects, find your next opportunity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-gradient-to-br from-purple-600 to-purple-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-purple-100 mb-12 max-w-2xl mx-auto">
            Join UCalgaryConnect today and start building meaningful connections with your fellow students.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 text-lg px-8 py-6">
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
