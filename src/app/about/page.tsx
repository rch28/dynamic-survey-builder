import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  BarChart4,
  Users,
  Zap,
  Layers,
  Shield,
} from "lucide-react";

const features = [
  {
    title: "Intuitive Builder",
    description:
      "Drag-and-drop interface makes creating surveys simple and fast.",

    icon: <CheckCircle2 className="h-8 w-8 text-primary mb-2" />,
    content:
      "Our visual editor lets you build surveys without any technical knowledge. Add questions, rearrange them, and customize your survey with just a few clicks.",
  },
  {
    title: "Question Types",
    description:
      "Multiple question formats to gather exactly the data you need.",
    icon: <Layers className="h-8 w-8 text-primary mb-2" />,
    content:
      "Choose from text, multiple choice, checkbox, dropdown, scale, and date questions. Each type is designed to collect specific kinds of feedback.",
  },
  {
    title: "Conditional Logic",
    description: "Create dynamic surveys that adapt to respondents' answers.",
    icon: <Zap className="h-8 w-8 text-primary mb-2" />,
    content:
      "Show or hide questions based on previous answers, creating a personalized experience for each respondent and collecting more relevant data.",
  },
  {
    title: "Analytics",
    description: "Visualize and understand your survey results.",
    icon: <BarChart4 className="h-8 w-8 text-primary mb-2" />,
    content:
      "Get real-time insights with our analytics dashboard. View response rates, answer distributions, and export data for deeper analysis.",
  },
  {
    title: "Collaboration",
    description: "Work together with your team on survey projects.",
    icon: <Users className="h-8 w-8 text-primary mb-2" />,
    content:
      "Share surveys with colleagues, assign roles and permissions, and collaborate on survey design and analysis in real-time.",
  },
  {
    title: "Data Security",
    description:
      "Your survey data is protected with enterprise-grade security.",
    icon: <Shield className="h-8 w-8 text-primary mb-2" />,
    content:
      "We use encryption, secure data storage, and follow best practices to ensure your data and your respondents' information stays private and secure.",
  },
];

export default function AboutPage() {
  return (
    <div className="p-8 space-y-12">
      {/* Hero section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto py-4">
        <h1 className="text-4xl font-bold tracking-tight">
          About Survey Builder
        </h1>
        <p className="text-xl text-muted-foreground">
          A powerful, flexible survey creation platform designed for
          researchers, businesses, and educators.
        </p>
      </div>
      {/* Mission section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items- py-4">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            We believe that gathering feedback should be simple, accessible, and
            insightful. Our mission is to provide powerful survey tools that
            help you make better decisions based on real data.
          </p>
          <p className="text-lg text-muted-foreground">
            Whether you're conducting academic research, gathering customer
            feedback, or planning an event, Survey Builder gives you the tools
            to create professional surveys in minutes.
          </p>
        </div>
        <div className="rounded-lg w-full shadow-lg ml-6">
          {/* <Image
            src="https://images.unsplash.com/photo-1589187775328-882e91b3db4f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHN1cnZleXxlbnwwfDB8MHx8fDA%3D"
            alt="Team collaboration"
            width={400}
            height={200}
            priority
            className="rounded-lg w-full h-auto object-cover"
          /> */}
        </div>
      </div>

      {/* Features section */}
      <div className="space-y-8 py-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold">Key Features</h2>
          <p className="text-lg text-muted-foreground mt-4">
            Our platform is built with powerful features to help you create
            effective surveys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI section */}
      <div className="bg-muted rounded-xl p-8 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">AI-Powered Suggestions</h2>
            <p className="text-lg mb-4">
              Our platform includes AI assistance to help you create better
              surveys faster. Get intelligent suggestions for questions based on
              your survey topic.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Generate relevant questions with a single prompt</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Improve question clarity and reduce bias</span>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <span>Save time with intelligent question formatting</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg overflow-hidden shadow-lg">
            {/* <img
              src="/placeholder.svg?height=300&width=500"
              alt="AI suggestions interface"
              className="w-full h-auto object-cover"
            /> */}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="">
        <div className="text-center space-y-6 max-w-2xl mx-auto py-8">
          <h2 className="text-3xl font-bold">Ready to create your survey?</h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of researchers, educators, and businesses who use
            Survey Builder to gather insights and make data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
