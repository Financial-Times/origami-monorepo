export default `
<form action="" data-o-component="o-forms">

	<div class="o-forms-field" role="group" aria-labelledby="date-group-title">
		<span class="o-forms-title" aria-hidden="true">
			<span class="o-forms-title__main" id="date-group-title">Date input</span>
		</span>

		<span class="o-forms-input o-forms-input--date">
			<label>
				<span class="o-forms-input__label" aria-hidden="true">DD</span>
				<input class="o-forms-input__day-part" id="date" type="text" name="date" value="" pattern="0[1-9]|[12]\\d|3[01]" aria-label="Day (DD)" required>
			</label>
			<label>
				<span class="o-forms-input__label" aria-hidden="true">MM</span>
				<input class="o-forms-input__month-part" id="date1" type="text" name="date" value="" pattern="0?[1-9]|1[012]" aria-label="Month (MM)" required>
			</label>
			<label>
				<span class="o-forms-input__label" aria-hidden="true">YYYY</span>
				<input class="o-forms-input__year-part" id="date2" type="text" name="date" value="" pattern="[0-9]{4}" aria-label="Year (YYYY)" required>
			</label>
		</span>
	</div>

	<label class="o-forms-field">
		<span class="o-forms-title">
			<span class="o-forms-title__main">Required text input</span>
		</span>

		<span class="o-forms-input o-forms-input--text">
			<input id="text" type="text" name="required" value="" required>
		</span>
	</label>

	<label class="o-forms-field o-forms-field--optional">
		<span class="o-forms-title">
			<span class="o-forms-title__main">Optional text input</span>
		</span>

		<span class="o-forms-input o-forms-input--text">
			<input type="text" name="optional" value="">
		</span>
	</label>

	<div class="o-forms-field" role="group" aria-labelledby="date-group-title">
		<span class="o-forms-title" aria-hidden="true">
			<span class="o-forms-title__main" id="date-group-title">Radio box input</span>
		</span>

		<span class="o-forms-input o-forms-input--radio-box">
			<div class="o-forms-input--radio-box__container">
				<label>
					<input type="radio" name="radioBox">
					<span class="o-forms-input__label" aria-hidden="true">Yes</span>
				</label>
				<label>
					<input type="radio" name="radioBox" checked>
					<span class="o-forms-input__label o-forms-input__label--negative" aria-hidden="true">No</span>
				</label>
			</div>
		</span>
	</div>

	<input id="hidden-demo" name="hidden-demo" type="hidden" value="123">

	<input class="o-buttons o-buttons--secondary" type="submit">
</form>
`;
