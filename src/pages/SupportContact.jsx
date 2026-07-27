import React from "react";

export default function SupportContact() {
  return (
    <section className="relative  flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-black to-indigo-800 px-3 sm:px-8 md:px-12 lg:px-20 py-16 md:py-24 overflow-hidden  ">
      {/* Soft Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Glow Effects */}
      <div className="absolute top-[-8rem] left-[-6rem] w-[22rem] sm:w-[30rem] md:w-[35rem] h-[22rem] sm:h-[30rem] md:h-[35rem] bg-purple-700/30 blur-[160px] rounded-full"></div>
      <div className="absolute bottom-[-8rem] right-[-6rem] w-[25rem] sm:w-[35rem] md:w-[40rem] h-[25rem] sm:h-[35rem] md:h-[40rem] bg-pink-600/30 blur-[180px] rounded-full"></div>

      {/* Heading */}
      <div className="relative text-center z-10 mb-8 sm:mb-12 px-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight drop-shadow-md mt-3">
          SUPERWINNINGS SUPPORT
        </h1>
        <p className="text-gray-300 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          Have a question or remark? Just send us a message — our team is ready
          to assist you anytime.
        </p>
      </div>

      {/* Contact Form */}
      <div className="relative z-10 w-[95%] sm:w-[90%] md:w-[80%] lg:max-w-2xl bg-gray-900/70 backdrop-blur-md rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-gray-800">
        <form className="space-y-5 sm:space-y-6 p-3">
          {/* Name */}
          <div>
            <label className="block mb-2 text-gray-300 text-sm sm:text-base font-medium">
              Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 sm:p-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-gray-300 text-sm sm:text-base font-medium">
              Email
            </label>
            <input
              type="email"
              placeholder="info@unisolution.in"
              value="info@unisolution.in"
              readOnly
              className="w-full p-3 sm:p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 text-sm sm:text-base focus:outline-none cursor-not-allowed"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block mb-2 text-gray-300 text-sm sm:text-base font-medium">
              Message
            </label>
            <textarea
              placeholder="Write your message..."
              rows="5"
              className="w-full p-3 sm:p-4 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 text-black font-bold rounded-xl text-sm sm:text-base md:text-lg shadow-lg hover:opacity-90 transition-all duration-200"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
}
