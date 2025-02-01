const FloatingActionButton = () => {
  const scrollToTopOfPage = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTopOfPage}
      className="xl:hidden fixed bottom-6 h-16 w-16 right-6 bg-blue-700  rounded-full shadow-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span className="text-md">↑</span>{" "}
      {/* You can use any icon or text here */}
    </button>
  );
};

export default FloatingActionButton;
