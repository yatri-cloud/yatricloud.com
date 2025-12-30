import { motion } from "framer-motion";

const features = [
  {
    title: "Built by Cloud Professionals",
    description: "Created by certified experts with real-world experience in AWS, Azure, and GCP.",
  },
  {
    title: "Designed for All Levels",
    description: "From beginners exploring cloud to working professionals advancing their careers.",
  },
  {
    title: "Exam-Ready Questions",
    description: "Practice tests mirror real certification exam patterns and difficulty levels.",
  },
];

export const TrustSection = () => {
  return (
    <section className="py-20 bg-surface-subtle border-y border-border/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
            Why Learn With Us
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <div className="h-3 w-3 rounded-full bg-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
