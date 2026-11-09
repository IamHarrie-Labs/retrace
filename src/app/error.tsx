"use client";
import Link from "next/link";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <div className="product-page" role="alert"><h1>This page<br /><em>didn’t load.</em></h1><p className="my-6 max-w-lg text-sm leading-7 text-muted">Something went wrong on our side. Try again, or go back to your devices. Anything you already saved is still saved.</p><div className="flex flex-wrap gap-5"><button onClick={reset} className="action-button">Try again</button><Link href="/devices" className="text-link">Back to my devices ↗</Link></div></div>;}
