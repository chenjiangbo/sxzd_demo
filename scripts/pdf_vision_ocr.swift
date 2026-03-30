import Foundation
import PDFKit
import Vision
import AppKit

struct PageText: Codable {
    let page: Int
    let text: String
}

struct OCRResult: Codable {
    let pageCount: Int
    let pages: [PageText]
}

@inline(__always)
func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}

guard CommandLine.arguments.count >= 2 else {
    fail("usage: swift pdf_vision_ocr.swift <pdf_path>")
}

let pdfPath = CommandLine.arguments[1]
let url = URL(fileURLWithPath: pdfPath)

guard let document = PDFDocument(url: url) else {
    fail("failed to open pdf: \(pdfPath)")
}

var pages: [PageText] = []
let pageCount = document.pageCount

for index in 0..<pageCount {
    guard let page = document.page(at: index) else {
        continue
    }

    let image = page.thumbnail(of: NSSize(width: 1800, height: 2400), for: .mediaBox)
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        continue
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    request.usesLanguageCorrection = true
    request.recognitionLevel = .accurate

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    try handler.perform([request])

    let text = (request.results ?? [])
        .compactMap { $0.topCandidates(1).first?.string }
        .joined(separator: "\n")
        .trimmingCharacters(in: .whitespacesAndNewlines)

    pages.append(PageText(page: index + 1, text: text))
}

let result = OCRResult(pageCount: pageCount, pages: pages)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .withoutEscapingSlashes]
let data = try encoder.encode(result)
FileHandle.standardOutput.write(data)
