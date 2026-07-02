import { CodiWidget } from '@/components/codi/CodiWidget'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ComoFunciona } from '@/components/sections/ComoFunciona'
import { Faq } from '@/components/sections/Faq'
import { Gamificacao } from '@/components/sections/Gamificacao'
import { Hero } from '@/components/sections/Hero'
import { ParaEscolas } from '@/components/sections/ParaEscolas'
import { Trilha } from '@/components/sections/Trilha'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ComoFunciona />
        <ParaEscolas />
        <Trilha />
        <Gamificacao />
        <Faq />

        <section id="contato" className={styles.contact}>
          <h2 className={styles.contactTitle}>Leve o Codinhos para a sua escola</h2>
          <p className={styles.contactText}>
            Sem compromisso: conte pra gente sobre a sua escola e retornamos com uma proposta.
          </p>
          <a className={styles.contactCta} href="mailto:contato@codinhos.com.br">
            Falar por e-mail
          </a>
        </section>
      </main>

      <Footer />
      <CodiWidget />
    </>
  )
}
