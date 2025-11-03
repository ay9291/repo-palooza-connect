import Navigation from "@/components/Navigation";
import { Building2, Award, Target, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">About Ms Furniture Enterprises</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for high-quality engineering wood furniture wholesale in Hyderabad
          </p>
        </div>

        {/* Company Overview */}
        <section className="mb-16">
          <Card className="bg-gradient-card">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-foreground">Who We Are</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      <strong className="text-foreground">Ms Furniture Enterprises</strong>, owned and operated by <strong className="text-foreground">Md Farman</strong>, is a trusted wholesale supplier located in Quthbullapur, Hyderabad, specializing exclusively in particle board furniture (engineering wood).
                    </p>
                    <p>
                      We offer office tables, dressing tables, cupboards, conference tables, and custom-made furniture all crafted from premium particle board. Our engineering wood furniture delivers durability, modern finishes, and competitive wholesale pricing for showrooms and retailers.
                    </p>
                    <p>
                      For custom furniture requirements in engineering wood, contact our owner directly to discuss your specifications. We specialize in bulk orders for showrooms across the region.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-muted-foreground">Quthbullapur, Hyderabad</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Specialization</h3>
                      <p className="text-muted-foreground">Particle Board (Engineering Wood)</p>
                      <p className="text-sm text-muted-foreground">Custom Furniture & Wholesale</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Our Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Our Commitment</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Premium Particle Board</h3>
                <p className="text-muted-foreground">
                  All furniture crafted from high-quality particle board (engineering wood) meeting commercial standards with durable construction and modern finishes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Competitive Pricing</h3>
                <p className="text-muted-foreground">
                  Wholesale pricing designed to help retailers and bulk buyers maximize their profit margins while maintaining quality.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Custom Manufacturing</h3>
                <p className="text-muted-foreground">
                  We create custom-made furniture in engineering wood. Contact owner for specifications and bulk orders. Reliable service for showrooms.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Product Range */}
        <section className="mb-16">
          <Card className="bg-gradient-card">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl font-bold mb-8 text-foreground">Engineering Wood Products</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Office Tables</h3>
                  <p className="text-muted-foreground">
                    Professional desks in particle board for modern workspaces and productivity.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Dressing Tables</h3>
                  <p className="text-muted-foreground">
                    Elegant vanities crafted from engineering wood with modern finishes.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Cupboards</h3>
                  <p className="text-muted-foreground">
                    Spacious wardrobes in particle board for storage solutions.
                  </p>
                </div>
                <div className="p-6 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-3 text-foreground">Conference Tables</h3>
                  <p className="text-muted-foreground">
                    Large boardroom tables in engineering wood for professional spaces.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact Info */}
        <section>
          <Card className="bg-gradient-accent">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl font-bold mb-6 text-accent-foreground">Get In Touch</h2>
              <p className="text-xl mb-8 text-accent-foreground/90">
                For all wholesale enquiries, contact us directly
              </p>
              <div className="space-y-4 text-accent-foreground/90">
                <p className="text-lg">
                  <strong>Owner:</strong> Md Farman
                </p>
                <p className="text-lg">
                  <strong>Phone:</strong> <a href="tel:+919542505181" className="hover:text-accent-foreground transition-smooth">+91 95425 05181</a>
                </p>
                <p className="text-lg">
                  <strong>Email:</strong> <a href="mailto:mdfarman9542@gmail.com" className="hover:text-accent-foreground transition-smooth">mdfarman9542@gmail.com</a>
                </p>
                <p className="text-lg">
                  <strong>Location:</strong> Quthbullapur, Hyderabad
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default About;