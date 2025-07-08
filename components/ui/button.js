// components/ui/button.js
export const buttonVariants = (variant = "default") => {
  switch (variant) {
    case "outline":
      return "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50";
    case "default":
    default:
      return "bg-violet-600 text-white hover:bg-violet-700";
  }
};

