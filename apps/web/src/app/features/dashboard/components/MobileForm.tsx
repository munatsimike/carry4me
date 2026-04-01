import { motion } from "framer-motion";

type MobileFormProps = {
  children: React.ReactNode;
  submit: () => void;
};

export default function MobileForm({ children, submit }: MobileFormProps) {
 return <form onSubmit={submit} className="">
    <motion.div
      initial={{ x: "-100%", opacity: 1 }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 30,
      }}
      className="flex flex-col gap-4 px-6 py-2 h-full"
    >
      {children}
    </motion.div>
  </form>;
}
