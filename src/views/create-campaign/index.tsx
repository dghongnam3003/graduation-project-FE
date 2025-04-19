'use client';

import ExperimentForm from "@/components/create-campaign/ExperimentForm";

const ExperimentFormPage = () => {
    return (
        <ExperimentForm onClose={function (): void {
            throw new Error("Function not implemented.");
        } } />
    );
};

export default ExperimentFormPage;