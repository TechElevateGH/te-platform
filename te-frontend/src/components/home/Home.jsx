import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Members from "./Members";
import ImpactStats from "./ImpactStats";
import Testimonials from "./Testimonials";
import CTASection from "./CTASection";
import Footer from "./Footer";

const Home = () => {
    localStorage.setItem('prevPage', "/");

    return (
        <div className="relative">
            <Navbar />
            <Hero />
            <Features />
            <ImpactStats />
            <Members />
            <Testimonials />
            <CTASection />
            <Footer />
        </div>
    );
}

export default Home;