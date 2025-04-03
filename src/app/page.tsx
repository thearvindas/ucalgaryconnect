import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect with Fellow <span className="text-purple-600">UCalgary</span> Students
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Connect with fellow students, share your interests, and find the perfect study partners for your courses.
              Don&apos;t miss out on the opportunity to enhance your academic journey!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Get Started
                </Button>
              </Link>
              <Link href="/find-partners">
                <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                  Find Partners
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose UCalgaryConnect?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Find Study Partners</CardTitle>
                <CardDescription>Connect with students in your courses</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Easily find and connect with students taking the same courses as you. Form study groups and collaborate on assignments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Share Skills</CardTitle>
                <CardDescription>Learn from and teach others</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Share your expertise and learn from others. Whether you're looking to teach or learn, find the perfect match.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join Projects</CardTitle>
                <CardDescription>Collaborate on exciting initiatives</CardDescription>
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
      <section className="py-20 bg-purple-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join UCalgaryConnect today and start building meaningful connections with your fellow students.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
