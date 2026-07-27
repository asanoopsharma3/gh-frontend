import { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";

const faqs = [
  {
    question: "What is SuperWinning?",
    answer:
      "Super Winning is an online quiz and gaming platform where users play KBC-style quizzes and win real rewards.",
  },
  {
    question: "I forgot my password. How can I reset it?",
    answer:
      "Click on the 'Forgot Password' link on the login page and follow the instructions to reset your password.",
  },
  {
    question: "How do I start a quiz?",
    answer:
      "After logging in, go to the quiz section, select a quiz, and click on 'Start' to begin.",
  },
  {
    question: "Do you offer bonuses or referral rewards?",
    answer:
      "Yes, we offer exciting referral bonuses. Invite your friends and earn rewards when they join.",
  },
  {
    question: "How can I set limits to control my spending?",
    answer:
      "You can set daily, weekly, or monthly limits in your account settings under 'Spending Limits'.",
  },
  {
    question: "Is playing quizzes on Super Winning legal?",
    answer:
      "Yes, Super Winning is 100% legal and compliant with online gaming regulations in India.",
  },
  {
    question: "Are quiz results fair?",
    answer:
      "All quizzes are based on transparent scoring algorithms to ensure fairness for all players.",
  },
];

export default function FAQSection() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section
      className="relative min-h-screen flex flex-col md:flex-row items-center justify-center 
                 bg-gradient-to-br from-purple-700 via-black to-indigo-800 text-white 
                 px-6 sm:px-12 lg:px-20 py-16 overflow-hidden"
    >
      {/* Soft overlay for depth */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col md:flex-row gap-12 w-full">
        {/* Left Side */}
        <div className="md:w-1/2 px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Frequently asked <br /> questions
          </h2>
          <p className="text-gray-300 max-w-md">
            Our dedicated support team is available around the clock to assist you
            with any queries or technical issues you might encounter.
          </p>
        </div>

        {/* Right Side */}
        <div className="md:w-1/2 space-y-4 px-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-600 pb-4 transition-all duration-300"
            >
              <button
                className="flex justify-between items-center w-full text-left font-semibold text-base sm:text-lg hover:text-purple-300 transition-colors"
                onClick={() => toggleFAQ(index)}
              >
                {faq.question}
                {activeIndex === index ? (
                  <FaTimes className="text-sm" />
                ) : (
                  <FaPlus className="text-sm" />
                )}
              </button>

              {activeIndex === index && (
                <p className="text-gray-300 mt-3 text-sm sm:text-base">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
