type LoadStateProps = {
  title: string;
  message: string;
};

export default function LoadState({ title, message }: LoadStateProps) {
  return (
    <section className="load-state" aria-live="polite">
      <p className="eyebrow">{title}</p>
      <h2>{message}</h2>
    </section>
  );
}
