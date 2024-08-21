import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome to Your Dashboard
          </h1>
          <p className="mt-4 text-gray-600">
            Manage your data, track your progress, and stay ahead with our
            powerful tools.
          </p>
          <div className="mt-8">
            <a
              href="/sales"
              className="bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </header>

      <section id="features" className="py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-gray-800">Features</h2>
          <p className="mt-4 text-gray-600">
            Explore the powerful features we offer to manage and analyze your
            data.
          </p>
          <div className="mt-8 flex flex-wrap justify-center">
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <Link to="/sales">
                <div className="rounded-lg shadow p-6 bg-black hover:bg-gray-900 hover:scale-110 transition-transform duration-300">
                  <h3 className="text-xl font-semibold text-white">Sales</h3>
                  <p className="mt-2 text-gray-400">
                    Detailed description of the feature and its benefits.
                  </p>
                </div>
              </Link>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <Link to="/customers">
                <div className="rounded-lg shadow p-6 bg-black hover:bg-gray-900 hover:scale-110 transition-transform duration-300">
                  <h3 className="text-xl font-semibold text-white">
                    Customers
                  </h3>
                  <p className="mt-2 text-gray-400">
                    Detailed description of the feature and its benefits.
                  </p>
                </div>
              </Link>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <Link to="/orders">
                <div className="rounded-lg shadow p-6 bg-black hover:bg-gray-900 hover:scale-110 transition-transform duration-300">
                  <h3 className="text-xl font-semibold text-white">Orders</h3>
                  <p className="mt-2 text-gray-400">
                    Detailed description of the feature and its benefits.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-gray-100 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold text-gray-800">Pricing</h2>
          <p className="mt-4 text-gray-600">
            Choose the plan that fits your needs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center">
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-800">Basic</h3>
                <p className="mt-2 text-gray-600">$9/month</p>
                <a
                  href="/signup"
                  className="mt-4 inline-block bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
                >
                  Sign Up
                </a>
              </div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-800">Pro</h3>
                <p className="mt-2 text-gray-600">$29/month</p>
                <a
                  href="/signup"
                  className="mt-4 inline-block bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
                >
                  Sign Up
                </a>
              </div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 p-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Enterprise
                </h3>
                <p className="mt-2 text-gray-600">Contact Us</p>
                <a
                  href="/contact"
                  className="mt-4 inline-block bg-blue-500 text-white py-2 px-6 rounded hover:bg-blue-600"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-800 py-6">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 My Dashboard. All rights reserved.
          </p>
          <p className="text-gray-400 mt-2">
            Contact us at support@mydashboard.com
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
