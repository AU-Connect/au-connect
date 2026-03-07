import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

const FeatureCard = ({ icon, title, description, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
        >
            <Card className="h-full glass-card border-none shadow-lg transition-all duration-500 rounded-2xl overflow-hidden group p-6 border border-transparent hover:border-primary hover:ring-1 hover:ring-primary/50 hover:shadow-[0_0_25px_rgba(52,193,227,0.5)]">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl border border-border-custom bg-white/50 group-hover:bg-primary group-hover:text-white transition-all duration-500 overflow-hidden shrink-0 shadow-sm">
                        {React.cloneElement(icon, {
                            className: `${icon.props.className || ''} w-6 h-6 group-hover:text-white transition-colors duration-500`
                        })}
                    </div>
                    <CardTitle className="text-xl font-bold text-heading tracking-tight leading-none transition-all duration-500">{title}</CardTitle>
                </div>
                <CardContent className="p-0">
                    <CardDescription className="text-sm text-body-text leading-relaxed font-medium transition-all duration-500">
                        {description}
                    </CardDescription>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default React.memo(FeatureCard);
