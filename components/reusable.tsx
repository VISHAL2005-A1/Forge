

export const GrayTitle = ({ children }: { children: React.ReactNode }) => {
    return <span className=" text-gray-500">{children}</span>;
}
export const BlueTitle = ({
    children,
    className = "",
}: { children: React.ReactNode, className?: string }) => {
    return <span className={`bg-linear-to-br font-serif from -blue-300 via-blue-4 to-blue-600 bg-clip-text  text-transparent ${className}`}>{children}</span>;
}

export const SectionLabel = ({ children }: { children: React.ReactNode }) => {
    return (
        <p className=" text-gray-500">

            <span className="text-sm text-gray-500" />
            {children}
            <span className="text-sm text-gray-500" />

        </p>);
}

export const SectionHeading = ({
    gray,
    blue,
}: {
    gray: string;
    blue: string;
}) => {
    return (
        <h2 className="font-serit text-[clamp(2rem, 4vw,3rem)] text-3xl leading-[1.1] tracking-tight text-center">
            <GrayTitle>{gray}</GrayTitle>
            <br />
            <BlueTitle className="ml-2">{blue}</BlueTitle>
        </h2>
    )
}
