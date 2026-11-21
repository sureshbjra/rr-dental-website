"use client";

import { useEffect, useId, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { treatments } from "@/config/content";
import { Button } from "@/components/ui/button";

const appointmentSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(100, "Please keep your name under 100 characters."),
  phone: z.string().trim().min(8, "Enter a phone number with at least 8 characters.").max(20, "Please check the phone number.").regex(/^[0-9+().\s-]+$/, "Use digits and common phone punctuation only."),
  email: z.string().trim().email("Enter a valid email address."),
  treatment: z.string().min(1, "Choose a treatment or select a general consultation."),
  doctor: z.string().min(1, "Choose a preference."),
  date: z.string().min(1, "Choose a preferred date."),
  time: z.string().min(1, "Choose a preferred time."),
  message: z.string().max(1000, "Keep your message under 1,000 characters."),
});

type AppointmentValues = z.infer<typeof appointmentSchema>;

const fieldClass = "mt-2 h-12 w-full rounded-xl border border-navy/15 bg-white/75 px-4 text-sm text-navy outline-none transition-colors placeholder:text-navy/35 focus:border-cyan focus:ring-2 focus:ring-cyan/20";
const labelClass = "font-ui block text-sm text-navy/75";

export function AppointmentForm() {
  const [submitted, setSubmitted] = useState(false);
  const formId = useId();
  const dateField = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<AppointmentValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { fullName: "", phone: "", email: "", treatment: "", doctor: "", date: "", time: "", message: "" },
  });
  const dateRegistration = register("date");
  useEffect(() => {
    const today = new Date();
    dateField.current?.setAttribute("min", `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  }, []);

  const submitDemo = handleSubmit(() => setSubmitted(true));

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-4">
        <p className="font-ui text-caption tracking-[0.18em] text-[#0369a1]">A GOOD PLACE TO START</p>
        <h2 className="font-display text-display-m mt-4">Tell us what works for you.</h2>
        <p className="mt-5 max-w-[35ch] text-navy/65">Share a preferred date and time. The clinic can confirm availability and discuss the next step with you.</p>
        <div className="mt-8 rounded-2xl border border-navy/10 bg-white/50 p-5">
          <p className="font-ui text-sm text-navy">Demo booking form</p>
          <p className="text-caption mt-2 text-navy/60">This form does not send or store information. It only demonstrates the appointment flow.</p>
        </div>
      </div>

      <div className="lg:col-span-7 lg:col-start-6">
        {submitted ? (
          <div role="status" className="rounded-[1.8rem] border border-cyan/30 bg-white/65 p-7 sm:p-10">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-cyan/15 text-cyan">✓</span>
            <h3 className="font-display mt-6 text-3xl">Demo request complete.</h3>
            <p className="mt-3 max-w-[44ch] text-navy/65">Nothing was sent to the clinic. A live version will need a secure booking service before patients can request an appointment online.</p>
            <Button type="button" variant="inverse" className="mt-7" onClick={() => setSubmitted(false)}>Edit demo request</Button>
          </div>
        ) : (
          <form onSubmit={submitDemo} noValidate className="rounded-[1.8rem] border border-navy/10 bg-white/55 p-5 shadow-[0_30px_80px_-60px_rgb(7_27_53/0.45)] sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`${formId}-fullName`}>Full name</label>
                <input id={`${formId}-fullName`} autoComplete="name" className={fieldClass} placeholder="Your name" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? `${formId}-fullName-error` : undefined} {...register("fullName")} />
                {errors.fullName && <p id={`${formId}-fullName-error`} className="text-caption mt-1.5 text-red-700">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor={`${formId}-phone`}>Phone</label>
                <input id={`${formId}-phone`} type="tel" autoComplete="tel" className={fieldClass} placeholder="Your phone number" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${formId}-phone-error` : undefined} {...register("phone")} />
                {errors.phone && <p id={`${formId}-phone-error`} className="text-caption mt-1.5 text-red-700">{errors.phone.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor={`${formId}-email`}>Email</label>
                <input id={`${formId}-email`} type="email" autoComplete="email" className={fieldClass} placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${formId}-email-error` : undefined} {...register("email")} />
                {errors.email && <p id={`${formId}-email-error`} className="text-caption mt-1.5 text-red-700">{errors.email.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor={`${formId}-treatment`}>Treatment</label>
                <select id={`${formId}-treatment`} className={fieldClass} aria-invalid={!!errors.treatment} aria-describedby={errors.treatment ? `${formId}-treatment-error` : undefined} {...register("treatment")}>
                  <option value="">Choose a topic</option>
                  <option value="General consultation">General consultation</option>
                  {treatments.map((treatment) => <option key={treatment.title} value={treatment.title}>{treatment.title}</option>)}
                </select>
                {errors.treatment && <p id={`${formId}-treatment-error`} className="text-caption mt-1.5 text-red-700">{errors.treatment.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor={`${formId}-doctor`}>Preferred doctor</label>
                <select id={`${formId}-doctor`} className={fieldClass} aria-invalid={!!errors.doctor} aria-describedby={errors.doctor ? `${formId}-doctor-error` : undefined} {...register("doctor")}>
                  <option value="">Choose a preference</option>
                  <option value="No preference">No preference</option>
                </select>
                <p className="text-caption mt-1.5 text-navy/70">Doctor options can be added when verified profiles are supplied.</p>
                {errors.doctor && <p id={`${formId}-doctor-error`} className="text-caption mt-1.5 text-red-700">{errors.doctor.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor={`${formId}-date`}>Preferred date</label>
                  <input id={`${formId}-date`} type="date" className={fieldClass} aria-invalid={!!errors.date} aria-describedby={errors.date ? `${formId}-date-error` : undefined} {...dateRegistration} ref={(element) => { dateRegistration.ref(element); dateField.current = element; }} />
                  {errors.date && <p id={`${formId}-date-error`} className="text-caption mt-1.5 text-red-700">{errors.date.message}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor={`${formId}-time`}>Preferred time</label>
                  <input id={`${formId}-time`} type="time" className={fieldClass} aria-invalid={!!errors.time} aria-describedby={errors.time ? `${formId}-time-error` : undefined} {...register("time")} />
                  {errors.time && <p id={`${formId}-time-error`} className="text-caption mt-1.5 text-red-700">{errors.time.message}</p>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor={`${formId}-message`}>Message <span className="text-navy/70">(optional)</span></label>
                <textarea id={`${formId}-message`} rows={4} className={`${fieldClass} h-auto resize-y py-3`} placeholder="Anything you'd like the team to know?" aria-invalid={!!errors.message} aria-describedby={errors.message ? `${formId}-message-error` : undefined} {...register("message")} />
                {errors.message && <p id={`${formId}-message-error`} className="text-caption mt-1.5 text-red-700">{errors.message.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-col justify-between gap-4 border-t border-navy/10 pt-5 sm:flex-row sm:items-center">
              <p className="text-caption max-w-[32ch] text-navy/70">Demo only. Do not enter medical or sensitive personal details.</p>
              <Button type="submit" size="lg">Preview request</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
