import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl prose prose-invert">
          <h1>Terms of Service</h1>

          <p>Last updated: January 2024</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to Udemy Yatri ("Service"). These Terms of Service ("Terms") govern your access to and use of
            the Udemy Yatri website, mobile application, and all related services, products, and content.
          </p>

          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on
            Udemy Yatri for personal, non-commercial transitory viewing only. This is the grant of a license,
            not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>Using the materials for any commercial purpose or for any public display</li>
            <li>Attempting to decompile or reverse engineer any software contained on the Service</li>
            <li>Removing any copyright or other proprietary notations from the materials</li>
            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
          </ul>

          <h2>3. Disclaimer</h2>
          <p>
            The materials on Udemy Yatri are provided on an "as is" basis. We make no warranties, expressed or implied,
            and hereby disclaim and negate all other warranties including, without limitation, implied warranties or
            conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property
            or other violation of rights.
          </p>

          <h2>4. Limitations</h2>
          <p>
            In no event shall Udemy Yatri or its suppliers be liable for any damages (including, without limitation,
            damages for loss of data or profit, or due to business interruption) arising out of the use or
            inability to use the materials on the Service.
          </p>

          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on Udemy Yatri could include technical, typographical, or photographic errors.
            We do not warrant that any of the materials on the Service are accurate, complete, or current.
          </p>

          <h2>6. Links</h2>
          <p>
            We have not reviewed all of the sites linked to our website and are not responsible for the contents of
            any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any
            such linked website is at the user's own risk.
          </p>

          <h2>7. Modifications</h2>
          <p>
            We may revise these Terms of Service for the Service at any time without notice. By using this Service,
            you are agreeing to be bound by the then current version of these Terms of Service.
          </p>

          <h2>8. Governing Law</h2>
          <p>
            These Terms of Service and any separate agreements we provide to clarify the Service are governed by
            and construed in accordance with the laws of the jurisdiction where we are located.
          </p>

          <h2>9. Contact Information</h2>
          <p>If you have any questions about these Terms of Service, please contact us at: legal@yatricloud.com</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfService;
