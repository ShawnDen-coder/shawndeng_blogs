export const introductionSummary = 'I build practical tools and self-hosted infrastructure for my own workflows.'

export function PersonalIntroduction({ className }: { className?: string }) {
  return (
    <div lang="en" className={className}>
      <p>{introductionSummary} My main interests are Kubernetes platform engineering, GitOps, DevOps automation, CI/CD, Python tooling, AI agents, and Rust systems programming.</p>
      <p>I work primarily with Kubernetes, FluxCD, Helm, Kustomize, Docker, GitHub Actions, SOPS, External Secrets, Apache Airflow, and Python. Python is my main language for automation and platform components, while Rust gives me a way to explore command-line tools and lower-level abstractions.</p>
      <p>Infrastructure as Code is central to how I work. Hosts, Kubernetes resources, Helm releases, application configuration, secrets integration, and operational workflows should be declarative, reproducible, versioned, automated, and recoverable. My homelab is managed like a software project: changes are documented, reviewed, tested, delivered through GitOps, and designed to be rebuilt when necessary.</p>
      <p>Most of what I build is for personal use, experimentation, and continuous learning. I value small reusable components, clear interfaces, automation over manual work, and documentation, testing, and observability as part of the system.</p>
      <p>Build it. Automate it. Understand it. 🚀</p>
    </div>
  )
}
