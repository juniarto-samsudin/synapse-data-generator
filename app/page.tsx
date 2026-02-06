"use client"

import * as React from "react"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

import View from "@/components/custom/view"

const formSchema = z.object({
  scanType: z.string().min(1, "Please select a scan type."),
  ipc: z
     .number()
    /* .number({
      required_error: "IPC is required.",
      invalid_type_error: "IPC must be a number.",
    }) */
    .int("IPC must be an integer.")
    .positive("IPC must be a positive number."),
})

export default function Home() {
  const [submitOK, setSubmitOK] = useState<boolean | null>(null)
  const [outputSubdir, setOutputSubdir] = useState<string | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scanType: "",
      ipc: undefined,
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("Form submitted:", data)
    toast("You submitted the following values:", {
      description: (
        <pre className="bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
      position: "top-center",
      classNames: {
        content: "flex flex-col gap-2",
      },
      style: {
        "--border-radius": "calc(var(--radius)  + 4px)",
      } as React.CSSProperties,
    })
    try{
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset: data.scanType,
          ipc: data.ipc,
        }),
      })
      const payload = await res.json()
      console.log('Response:', payload)
      if(res.ok){
        setSubmitOK(true)
        setOutputSubdir(payload.outputSubdir || null)
        toast.success(`Run submitted successfully! Run ID: ${payload.runId}`)
      } else {
        setSubmitOK(false)
        setOutputSubdir(null)
        toast.error(`Error submitting run: ${payload.error || 'Unknown error'}`)
      }
    }
    catch(err){
      console.error('Error submitting form:', err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
    <div className="w-full px-4 pt-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Synthetic Data Generator</CardTitle>
          <CardDescription>
            Generate Synthetic Data for Your Application with ease
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="scanType"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-scantype">
                    Dataset
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="form-rhf-demo-scantype"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select a scan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OCT">OCT</SelectItem>
                      <SelectItem value="Kidney">Kidney</SelectItem>
                      <SelectItem value="FUNDUS">FUNDUS</SelectItem>
                      <SelectItem value="UpperGI">UpperGI</SelectItem>
                      <SelectItem value="ISIC">ISIC</SelectItem>
                      <SelectItem value="Alzhiemer">Alzhiemer</SelectItem>
                      <SelectItem value="COVID">COVID</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="ipc"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-ipc">
                    IPC [Images Per Class]
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-ipc"
                    type="number"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter IPC number"
                    autoComplete="off"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    value={field.value ?? ""}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => {
            form.reset()
            setSubmitOK(null)
            setOutputSubdir(null)
            }}>
            Reset
          </Button>
          <Button type="submit" form="form-rhf-demo">
            Generate
          </Button>
        </Field>
      </CardFooter>
    </Card>
    </div>
    <View submitOK={submitOK} outputSubdir={outputSubdir} />
    </div>
  )
}

